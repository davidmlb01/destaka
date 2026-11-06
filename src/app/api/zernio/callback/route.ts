export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getZernioAccountId, probeAnalytics } from '@/lib/zernio/client'
import { inngest } from '@/lib/inngest/client'

// GET /api/zernio/callback
// Chamado em 2 cenarios:
// 1. Zernio redireciona aqui apos receber o code do Google (silent connect via prompt=none)
// 2. Google redireciona aqui com error= se prompt=none falhou (fallback gracioso)
// Em ambos os casos, tenta detectar accounts recem-criados no Zernio.
export async function GET(req: NextRequest) {
  const origin = 'https://destaka.com.br'
  const url = new URL(req.url)

  // Se Google retornou erro (prompt=none rejeitado), seguir pro dashboard sem bloquear
  const googleError = url.searchParams.get('error')
  if (googleError) {
    console.warn(`[zernio-callback] Google OAuth retornou error=${googleError}. Seguindo para dashboard.`)
    return NextResponse.redirect(`${origin}/dashboard?zernio=pending`)
  }

  try {
    const admin = createAdminSupa(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar orgs com profile mas sem account (pendentes de conexao)
    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, zernio_profile_id')
      .not('zernio_profile_id', 'is', null)
      .is('zernio_account_id', null)

    if (!orgs?.length) {
      return NextResponse.redirect(`${origin}/dashboard?zernio=skip`)
    }

    for (const org of orgs) {
      const accountId = await getZernioAccountId(org.zernio_profile_id)
      if (accountId) {
        await admin
          .from('organizations')
          .update({ zernio_account_id: accountId })
          .eq('id', org.id)

        console.log(`[zernio-callback] Account ${accountId} salvo para org ${org.id} (${org.name})`)

        // Probe analytics automatico
        const probe = await probeAnalytics(accountId)
        console.log(`[zernio-callback] Analytics probe org ${org.id}: available=${probe.available}`)

        // Disparar collectors + posts + reviews agora que Zernio esta conectado
        inngest.send([
          { name: 'destaka/performance.collect.requested', data: { organization_id: org.id } },
          { name: 'destaka/gbp.audit.requested', data: { organization_id: org.id } },
          { name: 'destaka/score.calculate.requested', data: { organization_id: org.id } },
          { name: 'destaka/post.generate.requested', data: { organization_id: org.id } },
          { name: 'destaka/reviews.monitor.requested', data: { organization_id: org.id } },
        ]).catch(() => {})
      }
    }

    return NextResponse.redirect(`${origin}/dashboard?zernio=connected`)
  } catch (err) {
    console.error('[zernio-callback] Error:', err)
    return NextResponse.redirect(`${origin}/dashboard?zernio=error`)
  }
}
