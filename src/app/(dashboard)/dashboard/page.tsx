import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { OptimizationConfirmCard } from './components/OptimizationConfirmCard'
import { ManualTasksCard } from './components/ManualTasksCard'
import { FreeDashboard } from './components/FreeDashboard'
import { getStripe } from '@/lib/stripe'

async function checkSubscription(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string): Promise<boolean> {
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', orgId)
    .single()

  const customerId = (org as Record<string, unknown>)?.stripe_customer_id as string | null
  if (!customerId) return false

  try {
    const stripe = getStripe()
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })
    return subscriptions.data.length > 0
  } catch {
    return false
  }
}

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

  const orgId = professional.organization_id
  const isSubscriber = await checkSubscription(supabase, orgId)

  const { data: org } = await supabase
    .from('organizations')
    .select('name, specialty')
    .eq('id', orgId)
    .single()

  const profileName = org?.name ?? 'Meu Perfil'

  // Dados do score para dashboard gratuito
  const { data: scoreData } = await supabase
    .from('scores')
    .select('score_total')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const score = scoreData?.score_total ?? 0

  if (!isSubscriber) {
    return (
      <DashboardLayout
        activeHref="/dashboard"
        profileName={profileName}
        userEmail={user.email ?? ''}
        isSubscriber={false}
      >
        <FreeDashboard
          score={score}
          profileName={profileName}
          specialty={org?.specialty ?? ''}
        />
      </DashboardLayout>
    )
  }

  // Dashboard completo para assinantes
  const { data: profile } = await supabase
    .from('gbp_profiles')
    .select('optimization_report, description, photo_count')
    .eq('organization_id', orgId)
    .maybeSingle()

  const { count: unrepliedReviewCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('reply', null)

  return (
    <DashboardLayout
      activeHref="/dashboard"
      profileName={profileName}
      userEmail={user.email ?? ''}
      isSubscriber={true}
    >
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
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
