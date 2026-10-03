import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '@/lib/inngest/client'
import { populateFromPlaces } from '@/lib/places/populate'
import { encrypt } from '@/lib/crypto'
import { listGmbLocations } from '@/lib/gmb/client'
import { detectSegment } from '@/lib/gmb/segment'

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
          ]).catch(() => {})
        } else {
          console.log(`[callback] provider_token ausente para org ${existingProfessional.organization_id}. Token nao atualizado.`)
        }

        populateFromPlaces(existingProfessional.organization_id).catch(() => {})
        return NextResponse.redirect(`${origin}/dashboard`)
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

      const { data: org, error: orgError } = await admin
        .from('organizations')
        .insert({
          name: orgName,
          specialty,
          phone: locationPhone || '',
          tone: 'proximo',
          automation_preference: 'automatico',
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

      // Dispara auditoria + score + populacao em background
      inngest.send([
        { name: 'destaka/gbp.audit.requested', data: { organization_id: org.id } },
        { name: 'destaka/score.calculate.requested', data: { organization_id: org.id } },
      ]).catch(() => {})

      populateFromPlaces(org.id).catch(() => {})

      // Direto pro dashboard (gratuito, sem onboarding)
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
