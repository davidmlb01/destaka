import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

// GET /api/auth/callback
// Supabase OAuth redireciona aqui com ?code=...
// Troca o code por sessão, salva tokens criptografados e upsert do user.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const { session } = data
  const user = session.user
  const accessToken = session.provider_token ?? null
  const refreshToken = session.provider_refresh_token ?? null

  const serviceClient = await createServiceClient()

  const { error: upsertError } = await serviceClient.from('users').upsert(
    {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      ...(accessToken && { google_access_token_enc: encrypt(accessToken) }),
      ...(refreshToken && { google_refresh_token_enc: encrypt(refreshToken) }),
    },
    { onConflict: 'id' }
  )

  if (upsertError) {
    console.error('[auth/callback] upsert user error:', upsertError)
    // Não bloqueia o login, só loga o erro
  }

  return NextResponse.redirect(`${origin}${next}`)
}
