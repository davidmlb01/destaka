import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '@/lib/inngest/client'

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

      // Persiste provider_token nos metadados do usuário para uso posterior
      if (session.provider_token) {
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            gbp_access_token: session.provider_token,
            gbp_refresh_token: session.provider_refresh_token ?? null,
            gbp_token_expires_at: session.expires_at
              ? new Date(session.expires_at * 1000).toISOString()
              : null,
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
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token ?? null,
            expires_at: session.expires_at
              ? new Date(session.expires_at * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id' })

          await inngest.send({
            name: 'destaka/gbp.audit.requested',
            data: { organization_id: professional.organization_id },
          })
        }

        return NextResponse.redirect(`${origin}/dashboard`)
      }

      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
