import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

interface AuthSuccess {
  user: User
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any
  serviceClient: SupabaseClient
  error?: undefined
}

interface AuthError {
  error: NextResponse
  user?: undefined
  profile?: undefined
  serviceClient?: undefined
}

type AuthResult = AuthSuccess | AuthError

/**
 * Helper de autenticacao para API routes.
 * Valida usuario, busca perfil GMB mais recente, retorna serviceClient pronto.
 *
 * @param fields - Campos do select em gmb_profiles (default: '*')
 */
export async function getAuthenticatedProfile(fields = '*'): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
  }

  const serviceClient = await createServiceClient()

  const { data: profile } = await serviceClient
    .from('gmb_profiles')
    .select(fields)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile) {
    return { error: NextResponse.json({ error: 'Nenhum perfil encontrado' }, { status: 404 }) }
  }

  return { user, profile, serviceClient }
}
