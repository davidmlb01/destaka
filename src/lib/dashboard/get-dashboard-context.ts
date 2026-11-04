import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isActiveSubscriber } from '@/lib/subscription'
import { cache } from 'react'

export interface DashboardContext {
  user: { id: string; email: string }
  orgId: string
  profileName: string
  specialty: string | null
  isSubscriber: boolean
}

// React cache() garante que chamadas multiplas no mesmo request reutilizam o resultado
export const getDashboardContext = cache(async (): Promise<DashboardContext> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) redirect('/login')

  const orgId = professional.organization_id

  const [{ data: org }, subscriber] = await Promise.all([
    supabase.from('organizations').select('name, specialty').eq('id', orgId).maybeSingle(),
    isActiveSubscriber(orgId),
  ])

  return {
    user: { id: user.id, email: user.email ?? '' },
    orgId,
    profileName: (org?.name as string) ?? 'Meu Perfil',
    specialty: (org?.specialty as string) ?? null,
    isSubscriber: subscriber,
  }
})
