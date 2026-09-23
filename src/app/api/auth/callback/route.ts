import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '@/lib/inngest/client'
import { populateFromPlaces } from '@/lib/places/populate'
import { encrypt } from '@/lib/crypto'

function createServiceClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      const user = session.user
      const admin = createServiceClient()

      // Persiste provider_token temporariamente nos metadados (limpo apos onboarding)
      // Necessario porque o onboarding cria a org e precisa do token para google_tokens
      if (session.provider_token) {
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            gbp_access_token: session.provider_token,
            gbp_refresh_token: session.provider_refresh_token ?? null,
          },
        })
      }

      // Verifica se usuário já completou onboarding
      const { data: professional } = await supabase
        .from('professionals')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (professional?.organization_id) {
        // Usuário existente: atualiza google_tokens e dispara auditoria
        if (session.provider_token) {
          await admin.from('google_tokens').upsert({
            organization_id: professional.organization_id,
            access_token: encrypt(session.provider_token),
            refresh_token: session.provider_refresh_token
              ? encrypt(session.provider_refresh_token)
              : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id' })

          // Limpar tokens do user_metadata (nao devem ficar client-side)
          await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              gbp_access_token: undefined,
              gbp_refresh_token: undefined,
            },
          })

          inngest.send({
            name: 'destaka/gbp.audit.requested',
            data: { organization_id: professional.organization_id },
          }).catch(() => {})
        }

        // Fire-and-forget: popula dashboard com dados do Places API
        // Garante que o usuario veja dados reais mesmo sem Business Profile API
        populateFromPlaces(professional.organization_id).catch(() => {})

        return NextResponse.redirect(`${origin}/dashboard`)
      }

      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
