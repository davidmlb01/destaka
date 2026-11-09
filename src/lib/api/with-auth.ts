import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

function adminClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface AuthOrgSuccess {
  user: User
  orgId: string
  supabase: Awaited<ReturnType<typeof createClient>>
  error?: undefined
}

interface AuthOrgError {
  error: NextResponse
  user?: undefined
  orgId?: undefined
  supabase?: undefined
}

type AuthOrgResult = AuthOrgSuccess | AuthOrgError

/**
 * Valida autenticação e retorna user + orgId + supabase client.
 * Substitui o padrão repetido em 23+ rotas API.
 */
export async function getAuthOrg(): Promise<AuthOrgResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
  }

  // Admin client para bypass RLS na tabela professionals
  const { data: professional } = await adminClient()
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return { error: NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 }) }
  }

  return { user, orgId: professional.organization_id, supabase }
}

/**
 * Cria resposta JSON com headers anti-cache.
 * Dados por usuário NUNCA devem ser cacheados pelo browser.
 */
export function privateJson(data: unknown, init?: { status?: number }) {
  const response = NextResponse.json(data, init)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Vary', 'Cookie')
  return response
}
