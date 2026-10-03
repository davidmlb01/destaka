export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { OptimizationConfirmCard } from './components/OptimizationConfirmCard'
import { ManualTasksCard } from './components/ManualTasksCard'
import { FreeDashboard } from './components/FreeDashboard'
import { CheckoutBanner } from './components/CheckoutBanner'
import { isActiveSubscriber } from '@/lib/subscription'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) redirect('/login')

  const orgId = professional.organization_id
  const params = await searchParams
  const checkoutStatus = params.checkout ?? null

  const [{ data: org }, isSubscriber] = await Promise.all([
    supabase.from('organizations').select('name, specialty').eq('id', orgId).maybeSingle(),
    isActiveSubscriber(orgId),
  ])

  const profileName = org?.name ?? 'Meu Perfil'

  if (!isSubscriber) {
    const { data: scoreData } = await supabase
      .from('scores')
      .select('total, snapshot_date')
      .eq('organization_id', orgId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    return (
      <DashboardLayout
        activeHref="/dashboard"
        profileName={profileName}
        userEmail={user.email ?? ''}
        isSubscriber={false}
      >
        {checkoutStatus && <CheckoutBanner status={checkoutStatus} />}
        <FreeDashboard
          score={Number((scoreData as Record<string, unknown>)?.total) || 0}
          profileName={profileName}
          specialty={org?.specialty ?? ''}
          isNewUser={!scoreData}
        />
      </DashboardLayout>
    )
  }

  const [{ data: profile }, { count: unrepliedReviewCount }] = await Promise.all([
    supabase.from('gbp_profiles').select('optimization_report, description, photo_count').eq('organization_id', orgId).maybeSingle(),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).is('reply', null),
  ])

  return (
    <DashboardLayout
      activeHref="/dashboard"
      profileName={profileName}
      userEmail={user.email ?? ''}
      isSubscriber={true}
    >
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {checkoutStatus && <CheckoutBanner status={checkoutStatus} />}

        <DashboardContent />

        <ManualTasksCard
          photoCount={profile?.photo_count ?? 0}
          unrepliedReviewCount={unrepliedReviewCount ?? 0}
        />

        <OptimizationConfirmCard
          optimizationReport={profile?.optimization_report ?? null}
          currentDescription={profile?.description ?? null}
        />
      </div>
    </DashboardLayout>
  )
}
