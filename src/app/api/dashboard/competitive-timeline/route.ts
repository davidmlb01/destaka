export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth
  const db = admin()

  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
  const cutoff = twelveWeeksAgo.toISOString().slice(0, 10)

  // Buscar posição no ranking ao longo do tempo
  const { data: positions } = await db
    .from('ranking_positions')
    .select('position, snapshot_date, top_competitor_name')
    .eq('organization_id', orgId)
    .gte('snapshot_date', cutoff)
    .order('snapshot_date', { ascending: true })

  // Buscar review snapshots
  const { data: reviewSnapshots } = await db
    .from('competitor_snapshots')
    .select('name, review_count, snapshot_date, is_self')
    .eq('organization_id', orgId)
    .gte('snapshot_date', cutoff)
    .order('snapshot_date', { ascending: true })

  if (!positions?.length && !reviewSnapshots?.length) {
    return privateJson({ empty: true })
  }

  // Posição: série temporal simples
  const positionSeries = (positions ?? []).map(p => ({
    date: p.snapshot_date,
    position: p.position,
    topCompetitor: p.top_competitor_name,
  }))

  // Reviews: já processado pelo velocity endpoint, mas aqui focamos no delta semanal
  const selfSnapshots = (reviewSnapshots ?? []).filter(s => s.is_self)
  const reviewSeries = selfSnapshots.map(s => ({
    date: s.snapshot_date,
    reviews: s.review_count,
  }))

  return privateJson({ positionSeries, reviewSeries })
}
