export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'

interface WeekMetrics {
  week_start: string
  impressions_direct: number
  impressions_indirect: number
  views_maps: number
  views_search: number
  actions_phone: number
  actions_directions: number
  actions_website: number
}

function sumMetrics(rows: WeekMetrics[]): Omit<WeekMetrics, 'week_start'> {
  return rows.reduce(
    (acc, r) => ({
      impressions_direct: acc.impressions_direct + (r.impressions_direct ?? 0),
      impressions_indirect: acc.impressions_indirect + (r.impressions_indirect ?? 0),
      views_maps: acc.views_maps + (r.views_maps ?? 0),
      views_search: acc.views_search + (r.views_search ?? 0),
      actions_phone: acc.actions_phone + (r.actions_phone ?? 0),
      actions_directions: acc.actions_directions + (r.actions_directions ?? 0),
      actions_website: acc.actions_website + (r.actions_website ?? 0),
    }),
    {
      impressions_direct: 0,
      impressions_indirect: 0,
      views_maps: 0,
      views_search: 0,
      actions_phone: 0,
      actions_directions: 0,
      actions_website: 0,
    }
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  // Ultimas 8 semanas de performance_metrics
  const { data: rows } = await supabase
    .from('performance_metrics')
    .select('week_start, impressions_direct, impressions_indirect, views_maps, views_search, actions_phone, actions_directions, actions_website')
    .eq('organization_id', orgId)
    .order('week_start', { ascending: false })
    .limit(8)

  if (!rows?.length) {
    return privateJson({ empty: true })
  }

  const sorted = [...rows].sort((a, b) => a.week_start.localeCompare(b.week_start))

  // Semana mais recente = current, penultima = previous
  const current = sorted[sorted.length - 1]
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null

  // Calcular deltas
  const totalImpressionsCurrent = (current.impressions_direct ?? 0) + (current.impressions_indirect ?? 0)
  const totalImpressionsPrev = previous
    ? (previous.impressions_direct ?? 0) + (previous.impressions_indirect ?? 0)
    : 0

  const totalActionsCurrent = (current.actions_phone ?? 0) + (current.actions_directions ?? 0) + (current.actions_website ?? 0)
  const totalActionsPrev = previous
    ? (previous.actions_phone ?? 0) + (previous.actions_directions ?? 0) + (previous.actions_website ?? 0)
    : 0

  const impressionsDelta = totalImpressionsPrev > 0
    ? Math.round(((totalImpressionsCurrent - totalImpressionsPrev) / totalImpressionsPrev) * 1000) / 10
    : null

  const actionsDelta = totalActionsPrev > 0
    ? totalActionsCurrent - totalActionsPrev
    : null

  return privateJson({
    current: {
      week_start: current.week_start,
      impressions: totalImpressionsCurrent,
      views_maps: current.views_maps ?? 0,
      views_search: current.views_search ?? 0,
      actions_phone: current.actions_phone ?? 0,
      actions_directions: current.actions_directions ?? 0,
      actions_website: current.actions_website ?? 0,
      actions_total: totalActionsCurrent,
    },
    previous: previous ? {
      week_start: previous.week_start,
      impressions: totalImpressionsPrev,
      actions_total: totalActionsPrev,
    } : null,
    deltas: {
      impressions_pct: impressionsDelta,
      actions_abs: actionsDelta,
    },
    history: sorted.map(r => ({
      week_start: r.week_start,
      impressions: (r.impressions_direct ?? 0) + (r.impressions_indirect ?? 0),
      views: (r.views_maps ?? 0) + (r.views_search ?? 0),
      actions: (r.actions_phone ?? 0) + (r.actions_directions ?? 0) + (r.actions_website ?? 0),
    })),
  })
}
