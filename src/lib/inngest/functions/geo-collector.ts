// Story 6.3: Coleta Geografica Semanal — driving direction metrics da GBP API v4
// Cron: toda segunda-feira as 06:00 UTC

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'
import { classifyRegions } from '@/lib/gmb/geo-analyzer'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const geoCollector = inngest.createFunction(
  {
    id: 'geo-collector',
    triggers: [
      { cron: '0 6 * * 1' },
      { event: 'destaka/geo.collect.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const eventData = (event as unknown as { data?: { organization_id?: string } }).data
      if (event.name === 'destaka/geo.collect.requested' && eventData?.organization_id) {
        return [eventData.organization_id]
      }
      const { data } = await db
        .from('google_tokens')
        .select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; status: string; regions?: number; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`geo-collect-${orgId}`, async () => {
        try {
          const validToken = await getValidTokenForOrg(db, orgId)
          if (!validToken) {
            return { org_id: orgId, status: 'skip', error: 'sem token Google' }
          }

          const { data: org } = await db
            .from('organizations')
            .select('gbp_location_id')
            .eq('id', orgId)
            .maybeSingle()

          if (!org?.gbp_location_id) {
            return { org_id: orgId, status: 'skip', error: 'sem gbp_location_id' }
          }

          // gmb_profiles usa user_id, nao organization_id
          const { data: prof } = await db
            .from('professionals')
            .select('user_id')
            .eq('organization_id', orgId)
            .maybeSingle()

          if (!prof?.user_id) {
            return { org_id: orgId, status: 'skip', error: 'sem professional' }
          }

          const { data: profile } = await db
            .from('gmb_profiles')
            .select('id, latitude, longitude')
            .eq('user_id', prof.user_id)
            .maybeSingle()

          if (!profile) {
            return { org_id: orgId, status: 'skip', error: 'sem perfil GBP' }
          }

          let centerLat = profile.latitude
          let centerLng = profile.longitude

          // Se nao tem coordenadas, buscar via Places API
          if (!centerLat || !centerLng) {
            try {
              const placesKey = process.env.GOOGLE_PLACES_API_KEY
              if (placesKey) {
                const { data: orgName } = await db
                  .from('organizations')
                  .select('name')
                  .eq('id', orgId)
                  .maybeSingle()

                const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
                searchUrl.searchParams.set('query', orgName?.name ?? '')
                searchUrl.searchParams.set('language', 'pt-BR')
                searchUrl.searchParams.set('key', placesKey)
                const searchRes = await fetch(searchUrl.toString())
                const searchData = await searchRes.json() as { results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }> }
                const loc = searchData.results?.[0]?.geometry?.location

                if (loc) {
                  centerLat = loc.lat
                  centerLng = loc.lng
                  await db
                    .from('gbp_profiles')
                    .update({ latitude: centerLat, longitude: centerLng })
                    .eq('id', profile.id)
                  console.log(`[geo-collector] Coordenadas salvas para org ${orgId}: ${centerLat}, ${centerLng}`)
                }
              }
            } catch (e) {
              console.log(`[geo-collector] Falha ao buscar coordenadas para org ${orgId}:`, e)
            }
          }

          if (!centerLat || !centerLng) {
            return { org_id: orgId, status: 'skip', error: 'sem coordenadas' }
          }

          // Chamar GBP API v4 reportInsights para driving directions
          const locationName = org.gbp_location_id
          const GBP_LOCATION_PATTERN = /^(accounts\/\d+\/)?locations\/\d+$/
          if (!GBP_LOCATION_PATTERN.test(locationName)) {
            return { org_id: orgId, status: 'skip', error: 'gbp_location_id formato invalido' }
          }
          const insightsUrl = `https://mybusiness.googleapis.com/v4/${locationName}:reportInsights`

          const insightsRes = await fetch(insightsUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${validToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              locationNames: [locationName],
              basicRequest: {
                metricRequests: [{ metric: 'QUERIES_DIRECT', options: ['AGGREGATED_DAILY'] }],
                timeRange: {
                  startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                  endTime: new Date().toISOString(),
                },
              },
              drivingDirectionsRequest: {
                numDays: 'THIRTY',
              },
            }),
          })

          if (!insightsRes.ok) {
            console.log(`[geo-collector] API error for org ${orgId}: status ${insightsRes.status}`)
            return { org_id: orgId, status: 'error', error: `API ${insightsRes.status}` }
          }

          const insightsData = await insightsRes.json() as {
            locationDrivingDirectionMetrics?: Array<{
              topDirectionSources?: Array<{
                regionCounts?: Array<{
                  latlng?: { latitude?: number; longitude?: number }
                  label?: string
                  count?: number | string
                }>
              }>
            }>
          }

          const regionCounts = insightsData.locationDrivingDirectionMetrics?.[0]
            ?.topDirectionSources?.[0]?.regionCounts ?? []

          const snapshot = classifyRegions(regionCounts, centerLat, centerLng)

          // Calcular week_start (segunda-feira da semana atual)
          const now = new Date()
          const dayOfWeek = now.getDay()
          const monday = new Date(now)
          monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
          const weekStart = monday.toISOString().split('T')[0]

          await db.from('geo_snapshots').upsert({
            org_id: orgId,
            profile_id: profile.id,
            center_lat: centerLat,
            center_lng: centerLng,
            radius_km: snapshot.radius_km,
            regions: snapshot.zones,
            day_count: 30,
            week_start: weekStart,
          }, { onConflict: 'org_id,week_start', ignoreDuplicates: false })

          console.log(`[geo-collector] Snapshot salvo para org ${orgId}: ${snapshot.zones.length} regioes, raio ${snapshot.radius_km}km`)
          return { org_id: orgId, status: 'ok', regions: snapshot.zones.length }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'unknown'
          console.log(`[geo-collector] Erro org ${orgId}: ${msg}`)
          return { org_id: orgId, status: 'error', error: msg }
        }
      })
      results.push(result)
    }

    console.log(`[geo-collector] Concluido: ${results.filter(r => r.status === 'ok').length}/${results.length} orgs`)
    return { processed: results.length, results }
  }
)
