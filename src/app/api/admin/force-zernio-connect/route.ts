export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { verifyAdminKey } from '@/lib/api/admin-auth'
import { decrypt } from '@/lib/crypto'
import { getZernioClient, getZernioAccountId, probeAnalytics } from '@/lib/zernio/client'

// POST /api/admin/force-zernio-connect
// Forca conexao Zernio usando o refresh_token Google ja existente.
// Troca o refresh_token por um novo access_token, depois usa o Zernio
// connect flow programaticamente.
export async function POST(req: Request) {
  if (!verifyAdminKey(req.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const orgId = body.org_id as string | undefined

  const db = createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar org com profile mas sem account
  const query = db
    .from('organizations')
    .select('id, name, zernio_profile_id, zernio_account_id')
    .not('zernio_profile_id', 'is', null)
    .is('zernio_account_id', null)

  if (orgId) query.eq('id', orgId)

  const { data: orgs } = await query
  if (!orgs?.length) {
    return NextResponse.json({ message: 'Nenhuma org pendente de conexao Zernio', tested: 0 })
  }

  const results = []

  for (const org of orgs) {
    try {
      // 1. Buscar tokens Google
      const { data: tokenRow } = await db
        .from('google_tokens')
        .select('access_token, refresh_token')
        .eq('organization_id', org.id)
        .maybeSingle()

      if (!tokenRow?.refresh_token) {
        results.push({ org_id: org.id, status: 'skip', reason: 'Sem refresh_token' })
        continue
      }

      // 2. Decriptar refresh_token e obter novo access_token
      const refreshToken = decrypt(tokenRow.refresh_token)
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      })

      if (!tokenRes.ok) {
        const err = await tokenRes.text()
        results.push({ org_id: org.id, status: 'error', reason: `Token refresh falhou: ${err.slice(0, 200)}` })
        continue
      }

      const { access_token: googleAccessToken } = await tokenRes.json()

      // 3. Tentar connect via Zernio usando token
      // O Zernio exige redirect flow para GBP, entao vamos tentar
      // o getConnectUrl e seguir server-side
      const zernio = getZernioClient()
      const profileId = org.zernio_profile_id

      // Gerar URL de conexao
      const { data: connectData } = await zernio.connect.getConnectUrl({
        path: { platform: 'googlebusiness' },
        query: {
          profileId,
          redirect_url: 'https://destaka.com.br/api/zernio/callback',
        },
      })

      const authUrl = connectData?.authUrl
      if (!authUrl) {
        results.push({ org_id: org.id, status: 'error', reason: 'Zernio nao retornou authUrl' })
        continue
      }

      // 4. Seguir o OAuth URL server-side
      // O authUrl aponta para accounts.google.com. Nao podemos seguir sem browser.
      // MAS: podemos extrair o state e usar o Google token exchange diretamente
      // para obter um authorization code e enviar ao Zernio

      // Alternativa: usar o access_token para chamar GBP API e listar locations
      // Depois usar Zernio para conectar com a location info

      // Na verdade, a melhor abordagem: verificar se o account ja foi criado
      // (talvez o ensureZernioProfile tenha falhado silenciosamente antes)
      const accountId = await getZernioAccountId(profileId)
      if (accountId) {
        await db.from('organizations').update({ zernio_account_id: accountId }).eq('id', org.id)
        const probe = await probeAnalytics(accountId)
        results.push({
          org_id: org.id,
          status: 'connected',
          account_id: accountId,
          analytics_available: probe.available,
        })
        continue
      }

      // Se chegou aqui, a conexao Zernio requer redirect flow interativo
      // Vamos retornar o link para uso manual ou auto-redirect
      results.push({
        org_id: org.id,
        status: 'needs_redirect',
        connect_url: authUrl,
        google_token_valid: true,
        message: 'Zernio exige redirect flow para GBP. Embutir auto-redirect no dashboard.',
      })
    } catch (err) {
      results.push({ org_id: org.id, status: 'error', reason: String(err) })
    }
  }

  return NextResponse.json({ tested: results.length, results })
}
