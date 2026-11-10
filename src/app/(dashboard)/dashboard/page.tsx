
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { OptimizationConfirmCard } from './components/OptimizationConfirmCard'
import { CheckoutBanner } from './components/CheckoutBanner'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const ctx = await getDashboardContext()
  const params = await searchParams
  const checkoutStatus = params.checkout ?? null

  if (!ctx.isSubscriber && checkoutStatus !== 'success') {
    redirect('/diagnostico')
  }

  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('lgpd_ai_consent')
    .eq('id', ctx.orgId)
    .maybeSingle()

  if (org?.lgpd_ai_consent !== true) {
    redirect('/onboarding')
  }

  const [{ data: profile }] = await Promise.all([
    supabase.from('gbp_profiles').select('optimization_report, description, photo_count').eq('organization_id', ctx.orgId).maybeSingle(),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('organization_id', ctx.orgId).is('response_text', null),
  ])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {checkoutStatus && <CheckoutBanner status={checkoutStatus} />}

      <DashboardContent />

      <OptimizationConfirmCard
        totalSuggestions={(() => {
          const r = profile?.optimization_report
          if (!r) return 0
          return (
            (r.description_variants?.length ?? 0) +
            (r.category_suggestions?.length ?? 0) +
            (r.attribute_suggestions?.length ?? 0) +
            (r.service_optimizations?.length ?? 0)
          )
        })()}
      />
    </div>
  )
}
