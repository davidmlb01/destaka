import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { OptimizationConfirmCard } from './components/OptimizationConfirmCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) redirect('/onboarding')

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', professional.organization_id)
    .single()

  const { data: profile } = await supabase
    .from('gbp_profiles')
    .select('optimization_report, description')
    .eq('organization_id', professional.organization_id)
    .maybeSingle()

  const profileName = org?.name ?? 'Meu Perfil'

  return (
    <DashboardLayout
      activeHref="/dashboard"
      profileName={profileName}
      userEmail={user.email ?? ''}
    >
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <DashboardContent />

        <OptimizationConfirmCard
          optimizationReport={profile?.optimization_report ?? null}
          currentDescription={profile?.description ?? null}
        />
      </div>
    </DashboardLayout>
  )
}
