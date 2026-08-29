import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'user'

interface RoleSuccess {
  user: User
  role: UserRole
  serviceClient: SupabaseClient
  error?: undefined
}

interface RoleError {
  error: NextResponse
  user?: undefined
  role?: undefined
  serviceClient?: undefined
}

type RoleResult = RoleSuccess | RoleError

/**
 * Helper de autorizacao por role para API routes.
 * Valida que o usuario autenticado possui um dos roles requeridos.
 *
 * Uso:
 *   const result = await withRole(['admin'])
 *   if (result.error) return result.error
 *   const { user, serviceClient } = result
 *
 * @param requiredRoles - Lista de roles aceitos (ex: ['admin'])
 */
export async function withRole(requiredRoles: UserRole[]): Promise<RoleResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
  }

  // Sempre usa service role para ler role — client anonimo nao pode ser confiado
  const serviceClient = await createServiceClient()
  const { data: userData } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (userData?.role ?? 'user') as UserRole

  if (!requiredRoles.includes(role)) {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }

  return { user, role, serviceClient }
}
