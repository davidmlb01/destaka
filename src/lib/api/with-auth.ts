import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

// Campos base sempre presentes quando fields='*'. Callers podem afunilar com campos específicos.
export type GmbProfile = {
  id: string
  user_id: string
  place_id: string
  name: string
  address: string | null
  phone: string | null
  website: string | null
  category: string | null
  score: number
  last_synced_at: string | null
  created_at: string
  updated_at: string
  google_location_id?: string | null
  google_place_id?: string | null
  [key: string]: unknown
}

interface AuthSuccess {
  user: User
  profile: GmbProfile
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

  const { data: rawProfile } = await serviceClient
    .from('gmb_profiles')
    .select(fields)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Supabase returns GenericStringError when select() uses a dynamic string — cast to GmbProfile
  const profile = rawProfile as GmbProfile | null

  if (!profile) {
    return { error: NextResponse.json({ error: 'Nenhum perfil encontrado' }, { status: 404 }) }
  }

  return { user, profile, serviceClient }
}
