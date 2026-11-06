import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '@/lib/inngest/client'
import { populateFromPlaces } from '@/lib/places/populate'
import { encrypt } from '@/lib/crypto'
import { listGmbLocations } from '@/lib/gmb/client'
import { detectSegment } from '@/lib/gmb/segment'
import { isActiveSubscriber } from '@/lib/subscription'
import { getOrCreateProfile, getZernioAccountId, generateConnectUrl } from '@/lib/zernio/client'

// Zernio redirect URI fixa (registrada no Google Cloud Console)
const ZERNIO_REDIRECT_URI = 'https://zernio.com/api/v1/connect/googlebusiness/callback'

// Conecta Zernio automaticamente sem clique extra.
// Estrategia:
// 1. Se ja tem account_id, vai direto pro destino
// 2. Checa se account ja existe no Zernio (criado entre sessoes)
// 3. Constroi URL Google OAuth com nosso client_id + redirect do Zernio + prompt=none
//    Como o usuario ACABOU de autorizar nosso client_id no login Supabase,
//    o Google auto-redireciona sem mostrar tela de consentimento (zero cliques extras)
// 4. O Zernio recebe o code, troca por tokens usando nosso client_id/secret
//    (registrado via createOAuthApp), e cria o account
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function connectZernioSilently(
  orgId: string,
  orgName: string,
  userEmail: string,
  finalUrl: string,
  db: { from: (...args: any[]) => any }
): Promise<NextResponse> {
  try {
    const { data: org } = await db
      .from('organizations')
      .select('zernio_profile_id, zernio_account_id')
      .eq('id', orgId)
      .maybeSingle() as { data: { zernio_profile_id?: string; zernio_account_id?: string } | null }

    // Ja tem account conectado, vai direto
    if (org?.zernio_account_id) {
      return NextResponse.redirect(finalUrl)
    }

    const profileId = org?.zernio_profile_id ?? await getOrCreateProfile(orgId, orgName)

    // Salvar profile_id se ainda nao existe
    if (!org?.zernio_profile_id) {
      await db.from('organizations').update({ zernio_profile_id: profileId }).eq('id', orgId)
    }

    // Checar se account ja existe no Zernio (criado entre sessoes)
    const existingAccountId = await getZernioAccountId(profileId)
    if (existingAccountId) {
      await db.from('organizations').update({ zernio_account_id: existingAccountId }).eq('id', orgId)
      return NextResponse.redirect(finalUrl)
    }

    // Gerar connect URL do Zernio para extrair o state assinado
    const zernioConnectUrl = await generateConnectUrl(profileId, finalUrl)
    const zernioUrl = new URL(zernioConnectUrl)
    const state = zernioUrl.searchParams.get('state')

    if (!state) {
      console.error('[callback] Zernio nao retornou state na connect URL')
      return NextResponse.redirect(finalUrl)
    }

    // Construir URL Google OAuth com NOSSO client_id + redirect do Zernio
    // prompt=none faz o Google auto-redirecionar sem tela de consentimento
    // (funciona porque o usuario acabou de autorizar nosso client_id)
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/auth')
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!)
    googleAuthUrl.searchParams.set('redirect_uri', ZERNIO_REDIRECT_URI)
    googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('access_type', 'offline')
    googleAuthUrl.searchParams.set('prompt', 'none')
    googleAuthUrl.searchParams.set('login_hint', userEmail)
    googleAuthUrl.searchParams.set('state', state)

    return NextResponse.redirect(googleAuthUrl.toString())
  } catch (e) {
    console.error('[callback] Zernio silent connect falhou, indo para destino final:', e)
    return NextResponse.redirect(finalUrl)
  }
}

function createServiceClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const ALLOWED_ORIGINS = ['https://destaka.com.br', 'https://www.destaka.com.br']
  const rawOrigin = new URL(request.url).origin
  const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://destaka.com.br'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      const user = session.user
      const admin = createServiceClient()

      // Verifica se usuario ja existe
      const { data: existingProfessional } = await supabase
        .from('professionals')
        .select('id, organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingProfessional?.organization_id) {
        // Professional com org: atualiza tokens e segue pro dashboard
        if (session.provider_token) {
          const tokenUpdate: Record<string, unknown> = {
            organization_id: existingProfessional.organization_id,
            access_token: encrypt(session.provider_token),
            updated_at: new Date().toISOString(),
          }
          // Google so retorna refresh_token na primeira autorizacao (ou com prompt=consent)
          // Nunca sobrescrever refresh_token existente com null
          if (session.provider_refresh_token) {
            tokenUpdate.refresh_token = encrypt(session.provider_refresh_token)
          }
          await admin.from('google_tokens').upsert(tokenUpdate, { onConflict: 'organization_id' })

          inngest.send([
            { name: 'destaka/gbp.audit.requested', data: { organization_id: existingProfessional.organization_id } },
            { name: 'destaka/score.calculate.requested', data: { organization_id: existingProfessional.organization_id } },
            { name: 'destaka/geo.collect.requested', data: { organization_id: existingProfessional.organization_id } },
            { name: 'destaka/keywords.snapshot.requested', data: { organization_id: existingProfessional.organization_id } },
            { name: 'destaka/performance.collect.requested', data: { organization_id: existingProfessional.organization_id } },
          ]).catch(() => {})
        } else {
          console.log(`[callback] provider_token ausente para org ${existingProfessional.organization_id}. Token nao atualizado.`)
        }

        populateFromPlaces(existingProfessional.organization_id).catch(() => {})

        // Verifica se onboarding foi completado
        const { data: orgCheck } = await admin
          .from('organizations')
          .select('lgpd_ai_consent, name')
          .eq('id', existingProfessional.organization_id)
          .maybeSingle()

        const isSubscriber = await isActiveSubscriber(existingProfessional.organization_id)
        const orgName = (orgCheck?.name as string) ?? ''

        const userEmail = user.email ?? ''

        // Assinante com onboarding completo: conectar Zernio silenciosamente, depois dashboard
        if (isSubscriber && orgCheck?.lgpd_ai_consent === true) {
          return connectZernioSilently(existingProfessional.organization_id, orgName, userEmail, `${origin}/dashboard`, admin)
        }
        // Nao-assinante ou onboarding incompleto: conectar Zernio silenciosamente, depois diagnostico
        return connectZernioSilently(existingProfessional.organization_id, orgName, userEmail, `${origin}/diagnostico`, admin)
      }

      // Busca dados do GBP para criar org
      let locationName = ''
      let locationPhone = ''
      let locationCategory = ''

      if (session.provider_token) {
        try {
          const locations = await listGmbLocations(session.provider_token)
          if (locations.length > 0) {
            locationName = locations[0].title || ''
            locationPhone = locations[0].phone || ''
            locationCategory = locations[0].category || ''
          }
        } catch {
          // GBP API indisponivel, segue com dados do Google profile
        }
      }

      const orgName = locationName || user.user_metadata?.full_name || user.email || 'Meu Negocio'
      const specialty = locationCategory ? detectSegment(locationCategory) : 'negócio local'

      // Captura UTMs do cookie (setado pelo TrackingScripts no client)
      const utmCookie = request.cookies.get('destaka_utm')?.value
      let utmData: Record<string, string> = {}
      if (utmCookie) {
        try { utmData = JSON.parse(decodeURIComponent(utmCookie)) } catch { /* ignore */ }
      }

      const { data: org, error: orgError } = await admin
        .from('organizations')
        .insert({
          name: orgName,
          specialty,
          phone: locationPhone || '',
          tone: 'proximo',
          automation_preference: 'automatico',
          utm_source: utmData.utm_source ?? null,
          utm_medium: utmData.utm_medium ?? null,
          utm_campaign: utmData.utm_campaign ?? null,
        })
        .select()
        .single()

      if (orgError) {
        console.error('[callback] Falha ao criar organização:', orgError.message)
        return NextResponse.redirect(`${origin}/login?error=org_creation_failed`)
      }

      if (existingProfessional) {
        // Professional existe mas sem org: vincular
        const { error: updateError } = await admin
          .from('professionals')
          .update({ organization_id: org.id })
          .eq('id', existingProfessional.id)

        if (updateError) {
          console.error('[callback] Falha ao vincular professional:', updateError.message)
          return NextResponse.redirect(`${origin}/login?error=profile_link_failed`)
        }
      } else {
        // Nenhum professional: criar do zero
        const { error: profError } = await admin
          .from('professionals')
          .insert({
            user_id: user.id,
            organization_id: org.id,
            email: user.email!,
            name: user.user_metadata?.full_name ?? user.email!,
            role: 'owner',
          })

        if (profError) {
          console.error('[callback] Falha ao criar professional:', profError.message)
          return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`)
        }
      }

      // Salva tokens do Google e limpa do user_metadata
      if (session.provider_token) {
        const newOrgToken: Record<string, unknown> = {
          organization_id: org.id,
          access_token: encrypt(session.provider_token),
          updated_at: new Date().toISOString(),
        }
        if (session.provider_refresh_token) {
          newOrgToken.refresh_token = encrypt(session.provider_refresh_token)
        }
        await admin.from('google_tokens').upsert(newOrgToken, { onConflict: 'organization_id' })

        // Limpa tokens do user_metadata (não devem ficar client-side)
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            gbp_access_token: undefined,
            gbp_refresh_token: undefined,
            gbp_token_expires_at: undefined,
          },
        })
      }

      // Dispara auditoria + geo + keywords + performance em background
      // Score NAO e disparado aqui: o audit ja dispara score.calculate ao finalizar,
      // garantindo que o score seja calculado apenas UMA vez com dados completos
      inngest.send([
        { name: 'destaka/gbp.audit.requested', data: { organization_id: org.id } },
        { name: 'destaka/geo.collect.requested', data: { organization_id: org.id } },
        { name: 'destaka/keywords.snapshot.requested', data: { organization_id: org.id } },
        { name: 'destaka/performance.collect.requested', data: { organization_id: org.id } },
      ]).catch(() => {})

      populateFromPlaces(org.id).catch(() => {})

      // Novo usuario: conectar Zernio silenciosamente, depois diagnostico
      return connectZernioSilently(org.id, orgName, user.email ?? '', `${origin}/diagnostico`, admin)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
