export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

function getServiceDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth

  const db = getServiceDb()

  const [{ data: expansionLogs }, { data: snapshots }] = await Promise.all([
    db
      .from('geo_expansion_log')
      .select('week_start, actions_taken, target_regions, previous_radius_km, current_radius_km, zones_before, zones_after')
      .eq('organization_id', orgId)
      .order('week_start', { ascending: false })
      .limit(8),
    db
      .from('geo_snapshots')
      .select('radius_km, week_start')
      .eq('org_id', orgId)
      .order('week_start', { ascending: false })
      .limit(8),
  ])

  const radiusHistory = (snapshots ?? []).reverse().map((s: { week_start: string; radius_km: number }) => ({
    week: s.week_start,
    radius: s.radius_km,
  }))

  const latestLog = (expansionLogs ?? [])[0] as {
    target_regions: string[]
    actions_taken: Array<{ type: string; detail: string }>
    current_radius_km: number
    previous_radius_km: number | null
  } | undefined

  return privateJson({
    radiusHistory,
    latestExpansion: latestLog ? {
      targetRegions: latestLog.target_regions,
      actionCount: latestLog.actions_taken?.length ?? 0,
      currentRadius: latestLog.current_radius_km,
      previousRadius: latestLog.previous_radius_km,
      radiusDelta: latestLog.previous_radius_km
        ? latestLog.current_radius_km - latestLog.previous_radius_km
        : null,
    } : null,
  })
}
