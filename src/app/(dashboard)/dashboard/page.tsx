export const dynamic = 'force-dynamic'


import { createClient as createAdminSupa } from '@supabase/supabase-js'
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

  const db = createAdminSupa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: org } = await db
    .from('organizations')
    .select('lgpd_ai_consent')
    .eq('id', ctx.orgId)
    .maybeSingle()

  if (org?.lgpd_ai_consent !== true) {
    redirect('/onboarding')
  }

  const [{ data: profile }] = await Promise.all([
    db.from('gbp_profiles').select('optimization_report, description, photo_count').eq('organization_id', ctx.orgId).maybeSingle(),
    db.from('reviews').select('id', { count: 'exact', head: true }).eq('organization_id', ctx.orgId).is('response_text', null),
  ])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {checkoutStatus && <CheckoutBanner status={checkoutStatus} />}

      <DashboardContent />

      <OptimizationConfirmCard
        totalSuggestions={(() => {
          const r = profile?.optimization_report as Record<string, unknown> | null
          if (!r) return 0
          const applied = Array.isArray(r.applied_sections) ? r.applied_sections as string[] : []
          return (
            (!applied.includes('description') ? (Array.isArray(r.description_variants) ? r.description_variants.length : 0) : 0) +
            (!applied.includes('categories') ? (Array.isArray(r.category_suggestions) ? r.category_suggestions.length : 0) : 0) +
            (!applied.includes('attributes') ? (Array.isArray(r.attribute_suggestions) ? r.attribute_suggestions.length : 0) : 0) +
            (!applied.includes('services') ? (Array.isArray(r.service_optimizations) ? r.service_optimizations.length : 0) : 0)
          )
        })()}
      />
    </div>
  )
}
