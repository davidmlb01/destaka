// Story 003: Competitor Intelligence — monitoramento semanal + descoberta on-demand
// Dispara toda segunda-feira às 8h ou via evento destaka/competitors.discover.requested

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { PlacesClient } from '@/lib/google/places-client'
import { analyzeCompetitors, type CompetitorSnapshot } from '@/lib/gbp/competitor-engine'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const competitorMonitor = inngest.createFunction(
  {
    id: 'competitor-monitor',
    triggers: [
      { cron: '0 8 * * 1' },
      { event: 'destaka/competitors.discover.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!mapsApiKey) {
      return { status: 'error', error: 'GOOGLE_MAPS_API_KEY não configurada' }
    }

    // Resolve quais organizações processar
    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      if (event.name === 'destaka/competitors.discover.requested') {
        return [(event as unknown as { data: { organization_id: string } }).data.organization_id]
      }
      const { data } = await db.from('organizations').select('id')
      return (data ?? []).map((r: { id: string }) => r.id)
    })

    const results: Array<{ org_id: string; status: string; competitors?: number; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`discover-competitors-${orgId}`, async () => {
        // Busca dados da organização e perfil GBP
        const { data: org } = await db
          .from('organizations')
          .select('id, name, specialty')
          .eq('id', orgId)
          .single()

        if (!org) return { org_id: orgId, status: 'skip', error: 'organização não encontrada' }

        const { data: profile } = await db
          .from('gbp_profiles')
          .select('location_id, address, photo_count, description, categories, audit_report')
          .eq('organization_id', orgId)
          .single()

        if (!profile?.address) {
          return { org_id: orgId, status: 'skip', error: 'endereço GBP não disponível' }
        }

        // Extrai lat/lng do endereço (formato da GBP API não inclui lat/lng diretamente)
        // Usa geocoding via Places text search como alternativa
        const address = profile.address as {
          addressLines?: string[]
          locality?: string
          administrativeArea?: string
          postalCode?: string
        }

        const addressQuery = [
          ...(address.addressLines ?? []),
          address.locality,
          address.administrativeArea,
          address.postalCode,
          'Brasil',
        ].filter(Boolean).join(', ')

        const places = new PlacesClient(mapsApiKey)

        // Geocodifica o endereço para obter lat/lng
        const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json')
        geocodeUrl.searchParams.set('address', addressQuery)
        geocodeUrl.searchParams.set('key', mapsApiKey)

        const geoRes = await fetch(geocodeUrl.toString())
        const geoData = await geoRes.json() as {
          status: string
          results: Array<{ geometry: { location: { lat: number; lng: number } } }>
        }

        if (geoData.status !== 'OK' || !geoData.results[0]) {
          return { org_id: orgId, status: 'skip', error: 'geocodificação falhou' }
        }

        const { lat, lng } = geoData.results[0].geometry.location

        // Busca concorrentes próximos
        const nearby = await places.nearbySearch({ lat, lng, specialty: org.specialty })
        const filtered = PlacesClient.excludeSelf(nearby, org.name)
        const top3 = filtered.slice(0, 3)

        if (top3.length === 0) {
          return { org_id: orgId, status: 'skip', error: 'nenhum concorrente encontrado' }
        }

        // Persiste ou atualiza concorrentes na tabela
        const competitorPayloads = top3.map(c => ({
          organization_id: orgId,
          name: c.name,
          place_id: c.place_id,
          categories: c.types ?? [],
          review_count: c.user_ratings_total ?? 0,
          avg_rating: c.rating ?? null,
          last_tracked_at: new Date().toISOString(),
        }))

        await db
          .from('competitors')
          .upsert(competitorPayloads, { onConflict: 'organization_id,place_id' })

        // Monta snapshots para análise
        const competitorSnapshots: CompetitorSnapshot[] = top3.map(c => ({
          name: c.name,
          place_id: c.place_id,
          categories: c.types ?? [],
          review_count: c.user_ratings_total ?? 0,
          avg_rating: c.rating ?? 0,
        }))

        // Dados do próprio perfil
        const auditReport = profile.audit_report as {
          review_count?: number
          avg_rating?: number
          category_count?: number
          has_description?: boolean
          photo_count?: number
        } | null

        const benchmark = await analyzeCompetitors({
          ownName: org.name,
          ownReviewCount: auditReport?.review_count ?? 0,
          ownAvgRating: auditReport?.avg_rating ?? 0,
          ownCategoryCount: auditReport?.category_count ?? (profile.categories?.length ?? 1),
          ownHasDescription: !!profile.description,
          ownPhotoCount: profile.photo_count ?? 0,
          competitors: competitorSnapshots,
          specialty: org.specialty,
        })

        // Persiste benchmark no perfil GBP
        if (profile.location_id) {
          await db
            .from('gbp_profiles')
            .update({ benchmark_report: benchmark })
            .eq('organization_id', orgId)
            .eq('location_id', profile.location_id)
        }

        return { org_id: orgId, status: 'ok', competitors: top3.length }
      })

      results.push(result as { org_id: string; status: string; competitors?: number; error?: string })
    }

    return { processed: results.length, results }
  }
)
