
import { redirect } from 'next/navigation'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { OptimizationsPage } from '@/components/dashboard/OptimizationsPage'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function OptimizationsRoute() {
  const ctx = await getDashboardContext()
  if (!ctx.isSubscriber) redirect('/dashboard/upgrade?feature=optimizations')

  const db = admin()

  const [{ data: profile }, { data: org }, { data: score }] = await Promise.all([
    db
      .from('gbp_profiles')
      .select('optimization_report, description, categories, attributes, services')
      .eq('organization_id', ctx.orgId)
      .maybeSingle(),
    db
      .from('organizations')
      .select('services, differentials, automation_preference')
      .eq('id', ctx.orgId)
      .maybeSingle(),
    db
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
