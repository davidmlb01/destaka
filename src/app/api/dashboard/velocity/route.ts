export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface SnapshotRow {
  name: string
  review_count: number
  snapshot_date: string
  is_self: boolean
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth
  const db = admin()

  // Buscar últimas 12 semanas de snapshots
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

  const { data: snapshots } = await db
    .from('competitor_snapshots')
    .select('name, review_count, snapshot_date, is_self')
    .eq('organization_id', orgId)
    .gte('snapshot_date', twelveWeeksAgo.toISOString().slice(0, 10))
    .order('snapshot_date', { ascending: true })

  if (!snapshots?.length) {
    return privateJson({ empty: true, series: [] })
  }

  // Agrupar por nome -> serie temporal
  const byName = new Map<string, { date: string; count: number }[]>()
  const selfName = { value: '' }

  for (const s of snapshots as SnapshotRow[]) {
    if (s.is_self) selfName.value = s.name
    if (!byName.has(s.name)) byName.set(s.name, [])
    byName.get(s.name)!.push({ date: s.snapshot_date, count: s.review_count })
  }

  // Montar series: self primeiro, depois concorrentes (top 3 por review_count atual)
  const series: { name: string; isSelf: boolean; data: { date: string; count: number }[] }[] = []

  if (selfName.value && byName.has(selfName.value)) {
    series.push({ name: selfName.value, isSelf: true, data: byName.get(selfName.value)! })
    byName.delete(selfName.value)
  }

  // Ordenar concorrentes pelo último review_count (descendente), pegar top 3
  const competitors = Array.from(byName.entries())
    .map(([name, data]) => ({ name, data, lastCount: data[data.length - 1]?.count ?? 0 }))
    .sort((a, b) => b.lastCount - a.lastCount)
    .slice(0, 3)

  for (const c of competitors) {
    series.push({ name: c.name, isSelf: false, data: c.data })
  }

  return privateJson({ series })
}
