export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

function adminClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth
  const db = adminClient()

  const [postsResult, reviewsResult, optimizationResult] = await Promise.all([
    // Posts pendentes de aprovacao (draft ou pending)
    db
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .in('status', ['draft', 'pending']),

    // Respostas de review pendentes de aprovacao
    db
      .from('review_responses')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'pending'),

    // Otimizacoes: contar sugestoes no optimization_report do gbp_profiles
    db
      .from('gbp_profiles')
      .select('optimization_report')
      .eq('organization_id', orgId)
      .maybeSingle(),
  ])

  // Calcular total de sugestoes de otimizacao pendentes
  let optimizations = 0
  const report = optimizationResult.data?.optimization_report as Record<string, unknown> | null
  if (report) {
    const cats = Array.isArray(report.category_suggestions) ? report.category_suggestions.length : 0
    const attrs = Array.isArray(report.attribute_suggestions) ? report.attribute_suggestions.length : 0
    const descs = Array.isArray(report.description_variants) ? report.description_variants.length : 0
    const svcs = Array.isArray(report.service_optimizations) ? report.service_optimizations.length : 0
    optimizations = cats + attrs + descs + svcs
  }

  return privateJson({
    posts: postsResult.count ?? 0,
    reviews: reviewsResult.count ?? 0,
    optimizations,
  })
}
