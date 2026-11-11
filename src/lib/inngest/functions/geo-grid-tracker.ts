// Geo-Grid Rank Tracker: Inngest function
// Cron semanal: verifica posição em grid 4x4 para cada org com keyword primária

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { trackGeoGrid } from '@/lib/ranking/geo-grid-tracker'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const geoGridTracker = inngest.createFunction(
  {
    id: 'geo-grid-tracker',
    concurrency: [{ limit: 1 }],
    triggers: [
      { cron: '0 6 * * 1' }, // Segunda 6h UTC (antes do ranking-tracker)
      { event: 'destaka/geo-grid.track.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const eventData = (event as unknown as { data?: { organization_id?: string } }).data
      if (event.name === 'destaka/geo-grid.track.requested' && eventData?.organization_id) {
        return [eventData.organization_id]
      }
      const { data } = await db.from('google_tokens').select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; status: string; points?: number; strong?: number }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`geo-grid-${orgId}`, async () => {
        // Buscar dados da org
        const { data: org } = await db
          .from('organizations')
          .select('name')
          .eq('id', orgId)
          .maybeSingle()

        if (!org?.name) return { org_id: orgId, status: 'skip', error: 'sem nome' }

        // Buscar coordenadas
        const { data: prof } = await db
          .from('professionals')
          .select('user_id')
          .eq('organization_id', orgId)
          .maybeSingle()

        let lat: number | null = null
        let lng: number | null = null

        if (prof?.user_id) {
          const { data: gmbProfile } = await db
            .from('gmb_profiles')
            .select('latitude, longitude')
            .eq('user_id', prof.user_id)
            .maybeSingle()
          lat = gmbProfile?.latitude as number | null
          lng = gmbProfile?.longitude as number | null
        }

        if (!lat || !lng) return { org_id: orgId, status: 'skip', error: 'sem coordenadas' }

        // Buscar keyword primária
        const { data: keyword } = await db
          .from('ranking_keywords')
          .select('id, keyword')
          .eq('organization_id', orgId)
          .eq('is_primary', true)
          .maybeSingle()

        if (!keyword) return { org_id: orgId, status: 'skip', error: 'sem keyword' }

        // Executar geo-grid tracking
        const gridResult = await trackGeoGrid({
          centerLat: lat,
          centerLng: lng,
          radiusKm: 3,
          gridSize: 4,
          keyword: keyword.keyword,
          businessName: org.name,
        })

        // Salvar snapshot
        const weekStart = new Date().toISOString().split('T')[0]
        await db.from('geo_grid_snapshots').insert({
          organization_id: orgId,
          keyword_id: keyword.id,
          keyword: keyword.keyword,
          grid_data: gridResult,
          radius_km: 3,
          grid_size: 4,
          week_start: weekStart,
        })

        console.log(`[geo-grid] Org ${orgId}: ${gridResult.summary.strong} strong, ${gridResult.summary.medium} medium, ${gridResult.summary.weak} weak, ${gridResult.summary.invisible} invisible`)

        return {
          org_id: orgId,
          status: 'ok',
          points: gridResult.points.length,
          strong: gridResult.summary.strong,
        }
      })

      results.push(result)
    }

    return { processed: results.length, results }
  }
)
