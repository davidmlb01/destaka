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

  // Buscar últimos 2 snapshots (atual + anterior para comparação)
  const { data: snapshots } = await db
    .from('geo_grid_snapshots')
    .select('grid_data, keyword, week_start')
    .eq('organization_id', orgId)
    .order('week_start', { ascending: false })
    .limit(2)

  if (!snapshots?.length) {
    return privateJson({ empty: true, message: 'Geo-grid sendo calculado. Primeiro resultado aparece na próxima segunda.' })
  }

  const current = snapshots[0]
  const previous = snapshots.length > 1 ? snapshots[1] : null

  return privateJson({
    current: current.grid_data,
    previous: previous?.grid_data ?? null,
    keyword: current.keyword,
    weekStart: current.week_start,
    previousWeekStart: previous?.week_start ?? null,
  })
}
