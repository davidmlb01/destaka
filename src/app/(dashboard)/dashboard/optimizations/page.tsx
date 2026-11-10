
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { OptimizationsPage } from '@/components/dashboard/OptimizationsPage'

export default async function OptimizationsRoute() {
  const ctx = await getDashboardContext()
  if (!ctx.isSubscriber) redirect('/dashboard/upgrade?feature=optimizations')

  const supabase = await createClient()

  const [{ data: profile }, { data: org }, { data: score }] = await Promise.all([
    supabase
      .from('gbp_profiles')
      .select('optimization_report, description, categories, attributes, services')
      .eq('organization_id', ctx.orgId)
      .maybeSingle(),
    supabase
      .from('organizations')
      .select('services, differentials, automation_preference')
      .eq('id', ctx.orgId)
      .maybeSingle(),
    supabase
      .from('scores')
      .select('total')
      .eq('organization_id', ctx.orgId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
      <OptimizationsPage
        optimizationReport={profile?.optimization_report ?? null}
        currentDescription={profile?.description ?? null}
        currentCategories={(profile?.categories as string[]) ?? []}
        onboardingServices={(org?.services as string[]) ?? []}
        onboardingDifferentials={(org?.differentials as string) ?? ''}
        automationPreference={(org?.automation_preference as string) ?? 'manual'}
        currentScore={score?.total ?? null}
      />
  )
}
