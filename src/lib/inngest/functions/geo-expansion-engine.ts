// EPIC-005: Geo Expansion Engine
// Analisa zonas fracas do geo_snapshot e executa otimizacoes automaticas no GBP
// para expandir o raio de visibilidade do profissional.
// Cron: toda segunda as 08:00 UTC (apos geo-collector as 06:00)

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'
import { GBPClient } from '@/lib/google/gbp-client'
import { generateContent } from '@/lib/ai/client'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface GeoZone {
  lat: number
  lng: number
  label: string
  count: number
  status: 'strong' | 'medium' | 'weak'
}

// Reverse geocode coordinates to neighborhood/region name
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=pt-BR&result_type=sublocality|neighborhood|locality&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json() as {
      results?: Array<{
        address_components?: Array<{
          long_name: string
          types: string[]
        }>
      }>
    }

    const result = data.results?.[0]
    if (!result?.address_components) return null

    // Prefer sublocality (bairro), then neighborhood, then locality (cidade)
    for (const type of ['sublocality_level_1', 'sublocality', 'neighborhood']) {
      const comp = result.address_components.find(c => c.types.includes(type))
      if (comp) return comp.long_name
    }

    const locality = result.address_components.find(c => c.types.includes('locality'))
    return locality?.long_name ?? null
  } catch {
    return null
  }
}

export const geoExpansionEngine = inngest.createFunction(
  {
    id: 'geo-expansion-engine',
    triggers: [
      { cron: '0 8 * * 1' },
      { event: 'destaka/geo.expansion.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const eventData = (event as unknown as { data?: { organization_id?: string } }).data
      if (event.name === 'destaka/geo.expansion.requested' && eventData?.organization_id) {
        return [eventData.organization_id]
      }
      const { data } = await db
        .from('google_tokens')
        .select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; status: string; actions?: number; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`geo-expand-${orgId}`, async () => {
        try {
          // Get latest and previous geo snapshots
          const { data: snapshots } = await db
            .from('geo_snapshots')
            .select('regions, radius_km, week_start, center_lat, center_lng')
            .eq('org_id', orgId)
            .order('week_start', { ascending: false })
            .limit(2)

          if (!snapshots?.length) {
            return { org_id: orgId, status: 'skip', error: 'sem geo_snapshot' }
          }

          const current = snapshots[0]
          const previous = snapshots[1] ?? null
          const zones = (current.regions as GeoZone[]) ?? []
          const weakZones = zones.filter(z => z.status === 'weak' || z.status === 'medium')

          if (weakZones.length === 0) {
            return { org_id: orgId, status: 'skip', error: 'sem zonas fracas' }
          }

          // Get org info
          const { data: org } = await db
            .from('organizations')
            .select('gbp_location_id, name, specialty')
            .eq('id', orgId)
            .maybeSingle()

          if (!org?.gbp_location_id) {
            return { org_id: orgId, status: 'skip', error: 'sem location GBP' }
          }

          // Get valid token
          const { data: prof } = await db
            .from('professionals')
            .select('user_id')
            .eq('organization_id', orgId)
            .maybeSingle()

          if (!prof?.user_id) {
            return { org_id: orgId, status: 'skip', error: 'sem professional' }
          }

          let accessToken: string
          try {
            const tokenResult = await getValidTokenForOrg(orgId)
            accessToken = tokenResult.access_token
          } catch {
            return { org_id: orgId, status: 'skip', error: 'token invalido' }
          }

          // Reverse geocode weak zones to get neighborhood names
          const targetRegions: string[] = []
          for (const zone of weakZones.slice(0, 3)) {
            const name = await reverseGeocode(zone.lat, zone.lng)
            if (name && !targetRegions.includes(name)) {
              targetRegions.push(name)
            }
          }

          if (targetRegions.length === 0) {
            return { org_id: orgId, status: 'skip', error: 'nao conseguiu geocodificar zonas' }
          }

          const actionsTaken: Array<{ type: string; detail: string }> = []
          const gbp = new GBPClient(accessToken)
          const locationName = org.gbp_location_id

          // Action 1: Generate geo-targeted post
          try {
            const specialty = org.specialty ?? 'saude'
            const regions = targetRegions.join(', ')
            const prompt = `Voce e um especialista em marketing digital para profissionais de ${specialty}.
Escreva um post curto (max 300 caracteres) para o Google Meu Negocio.
O post deve mencionar naturalmente a regiao "${regions}" para atrair pacientes dessa area.
O tom deve ser profissional e acolhedor. Nao use hashtags.
Nao mencione que e um post para SEO ou otimizacao.
Responda APENAS com o texto do post, sem aspas.`

            const postContent = await generateContent(prompt)
            if (postContent && postContent.length > 20) {
              await gbp.createPost(locationName, { summary: postContent.slice(0, 1500) })
              actionsTaken.push({ type: 'post', detail: `Post geo-targeted: ${targetRegions.join(', ')}` })
            }
          } catch (e) {
            console.error(`[geo-expansion] Post failed org ${orgId}:`, e instanceof Error ? e.message : e)
          }

          // Action 2: Enrich description with geo keywords
          try {
            const { data: profile } = await db
              .from('gbp_profiles')
              .select('description')
              .eq('organization_id', orgId)
              .maybeSingle()

            const currentDesc = (profile?.description as string) ?? ''
            const missingRegions = targetRegions.filter(r =>
              !currentDesc.toLowerCase().includes(r.toLowerCase())
            )

            if (missingRegions.length > 0 && currentDesc.length > 0) {
              const prompt = `Reescreva esta descricao de perfil do Google Meu Negocio, adicionando mencoes naturais as regioes ${missingRegions.join(', ')}.
Mantenha o tom profissional. Nao mude o sentido original. Max 750 caracteres.
Descricao atual:
${currentDesc}

Responda APENAS com a nova descricao, sem aspas.`

              const newDesc = await generateContent(prompt)
              if (newDesc && newDesc.length >= 50 && newDesc.length <= 750) {
                const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?updateMask=profile.description`
                const res = await fetch(url, {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ profile: { description: newDesc } }),
                })

                if (res.ok) {
                  await db.from('gbp_profiles').update({ description: newDesc }).eq('organization_id', orgId)
                  actionsTaken.push({ type: 'description', detail: `Regioes adicionadas: ${missingRegions.join(', ')}` })
                }
              }
            }
          } catch (e) {
            console.error(`[geo-expansion] Description failed org ${orgId}:`, e instanceof Error ? e.message : e)
          }

          // Save expansion log
          const weekStart = getWeekStart()
          await db.from('geo_expansion_log').insert({
            organization_id: orgId,
            week_start: weekStart,
            actions_taken: actionsTaken,
            target_regions: targetRegions,
            previous_radius_km: previous?.radius_km ?? null,
            current_radius_km: current.radius_km,
            zones_before: previous ? (previous.regions as GeoZone[])?.length ?? 0 : null,
            zones_after: zones.length,
          })

          console.log(`[geo-expansion] Org ${orgId}: ${actionsTaken.length} acoes, regioes alvo: ${targetRegions.join(', ')}`)
          return { org_id: orgId, status: 'ok', actions: actionsTaken.length }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'unknown'
          console.error(`[geo-expansion] Erro org ${orgId}: ${msg}`)
          return { org_id: orgId, status: 'error', error: msg }
        }
      })
      results.push(result)
    }

    return { processed: results.length, results }
  }
)

function getWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  return monday.toISOString().split('T')[0]
}
