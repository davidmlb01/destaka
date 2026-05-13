import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'
import { logger } from '@/lib/logger'

// GET /api/auth/callback
// Supabase OAuth redireciona aqui com ?code=...
// Troca o code por sessão, salva tokens criptografados e upsert do user.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // CRIT-03: valida next para evitar open redirect
  const rawNext = searchParams.get('next') ?? '/saude/onboarding'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/saude/onboarding'

  if (!code) {
    return NextResponse.redirect(`${origin}/saude/login?error=missing_code`)
  }

  logger.info('auth/callback', 'iniciando troca de code por sessão')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    logger.error('auth/callback', 'exchangeCodeForSession falhou', { error: error?.message })
    return NextResponse.redirect(`${origin}/saude/login?error=auth_failed`)
  }

  const { session } = data
  const user = session.user
  const accessToken = session.provider_token ?? null
  const refreshToken = session.provider_refresh_token ?? null

  logger.info('auth/callback', 'sessão criada', { userId: user.id })

  // Se o token do Google não foi retornado, o usuário não autorizou o escopo
  // business.manage. Redireciona para login para forçar nova tentativa com consent.
  if (!accessToken) {
    logger.error('auth/callback', 'provider_token ausente — escopo não concedido', { userId: user.id })
    return NextResponse.redirect(`${origin}/saude/login?error=missing_scope`)
  }

  const serviceClient = await createServiceClient()

  const { error: upsertError } = await serviceClient.from('users').upsert(
    {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      google_access_token_enc: encrypt(accessToken),
      ...(refreshToken && { google_refresh_token_enc: encrypt(refreshToken) }),
    },
    { onConflict: 'id' }
  )

  if (upsertError) {
    logger.error('auth/callback', 'upsert user falhou', { userId: user.id, error: upsertError.message })
    return NextResponse.redirect(`${origin}/saude/login?error=db_error`)
  }

  logger.info('auth/callback', 'usuário salvo, redirecionando', { userId: user.id, next })
  return NextResponse.redirect(`${origin}${next}`)
}
