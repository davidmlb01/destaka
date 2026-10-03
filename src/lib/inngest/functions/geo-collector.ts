// Story 6.3: Coleta Geografica Semanal
// Estrategia: coordenadas do negocio + concorrentes via Places API
// GBP API v4 reportInsights foi descontinuada (404). Usamos dados existentes.
// Cron: toda segunda-feira as 06:00 UTC

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'

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
          // Buscar professional para mapear org -> user -> gmb_profile
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

          let centerLat = profile.latitude as number | null
          let centerLng = profile.longitude as number | null

          // Se nao tem coordenadas, tentar buscar via Places API
          if (!centerLat || !centerLng) {
            const placesKey = process.env.GOOGLE_PLACES_API_KEY
            if (placesKey) {
              try {
                const { data: profileData } = await db
                  .from('gmb_profiles')
                  .select('name, address, google_place_id')
                  .eq('id', profile.id)
                  .maybeSingle()

                if (profileData?.google_place_id) {
                  const detailUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json')
                  detailUrl.searchParams.set('place_id', profileData.google_place_id)
                  detailUrl.searchParams.set('fields', 'geometry')
                  detailUrl.searchParams.set('key', placesKey)
                  const res = await fetch(detailUrl.toString())
                  const data = await res.json() as { result?: { geometry?: { location?: { lat: number; lng: number } } } }
                  const loc = data.result?.geometry?.location
                  if (loc) {
                    centerLat = loc.lat
                    centerLng = loc.lng
                  }
                }

                if (!centerLat || !centerLng) {
                  const query = `${profileData?.name ?? ''} ${profileData?.address ?? ''}`
                  const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
                  searchUrl.searchParams.set('query', query)
                  searchUrl.searchParams.set('language', 'pt-BR')
                  searchUrl.searchParams.set('key', placesKey)
                  const res = await fetch(searchUrl.toString())
                  const data = await res.json() as { results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }> }
                  const loc = data.results?.[0]?.geometry?.location
                  if (loc) {
                    centerLat = loc.lat
                    centerLng = loc.lng
                  }
                }

                if (centerLat && centerLng) {
                  await db
                    .from('gmb_profiles')
                    .update({ latitude: centerLat, longitude: centerLng })
                    .eq('id', profile.id)
                  console.log(`[geo-collector] Coordenadas salvas: ${centerLat}, ${centerLng}`)
                }
              } catch (e) {
                console.log(`[geo-collector] Falha coordenadas org ${orgId}`)
              }
            }
          }

          if (!centerLat || !centerLng) {
            return { org_id: orgId, status: 'skip', error: 'sem coordenadas' }
          }

          // Buscar concorrentes com place_id para obter coordenadas
          const { data: competitors } = await db
            .from('competitors')
            .select('place_id, name, address, avg_rating, review_count')
            .eq('profile_id', profile.id)

          const zones: Array<{ lat: number; lng: number; label: string; count: number; status: 'strong' | 'medium' | 'weak' }> = []
          const placesKey = process.env.GOOGLE_PLACES_API_KEY

          if (competitors?.length && placesKey) {
            for (const comp of competitors) {
              if (!comp.place_id) continue
              try {
                const detailUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json')
                detailUrl.searchParams.set('place_id', comp.place_id)
                detailUrl.searchParams.set('fields', 'geometry')
                detailUrl.searchParams.set('key', placesKey)
                const res = await fetch(detailUrl.toString())
                const data = await res.json() as { result?: { geometry?: { location?: { lat: number; lng: number } } } }
                const loc = data.result?.geometry?.location
                if (loc) {
                  // Concorrentes perto = area competitiva (medium/weak)
                  const dist = haversineKm(centerLat, centerLng, loc.lat, loc.lng)
                  zones.push({
                    lat: loc.lat,
                    lng: loc.lng,
                    label: comp.name ?? 'Concorrente',
                    count: comp.review_count ?? 0,
                    status: dist < 2 ? 'weak' : 'medium',
                  })
                }
              } catch {
                // skip competitor
              }
            }
          }

          // Adicionar zona do proprio negocio como strong
          zones.unshift({
            lat: centerLat,
            lng: centerLng,
            label: 'Seu negocio',
            count: 100,
            status: 'strong',
          })

          // Calcular raio
          let maxDist = 2 // minimo 2km
          for (const z of zones) {
            const d = haversineKm(centerLat, centerLng, z.lat, z.lng)
            if (d > maxDist) maxDist = d
          }

          const weekStart = getWeekStart()

          await db.from('geo_snapshots').upsert({
            org_id: orgId,
            profile_id: profile.id,
            center_lat: centerLat,
            center_lng: centerLng,
            radius_km: Math.round(maxDist * 10) / 10,
            regions: zones,
            day_count: 30,
            week_start: weekStart,
          }, { onConflict: 'org_id,week_start', ignoreDuplicates: false })

          console.log(`[geo-collector] Snapshot salvo org ${orgId}: ${zones.length} zonas, raio ${maxDist.toFixed(1)}km`)
          return { org_id: orgId, status: 'ok', regions: zones.length }
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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  return monday.toISOString().split('T')[0]
}
