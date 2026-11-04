// Motor de Ranking: Inngest function
// Cron semanal: gera keywords (se nao existem) e rastreia posicao para cada uma.
// Tambem aceita trigger manual via evento.

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { generateKeywords } from '@/lib/ranking/keyword-mapper'
import { trackPosition } from '@/lib/ranking/position-tracker'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const rankingTracker = inngest.createFunction(
  {
    id: 'ranking-tracker',
    triggers: [
      { cron: '0 7 * * 1' }, // Segunda 7h UTC (antes do performance-collector)
      { event: 'destaka/ranking.track.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const eventData = (event as unknown as { data?: { organization_id?: string } }).data
      if (event.name === 'destaka/ranking.track.requested' && eventData?.organization_id) {
        return [eventData.organization_id]
      }
      const { data } = await db.from('google_tokens').select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; status: string; keywords?: number; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`rank-track-${orgId}`, async () => {
        try {
          // 1. Buscar dados da org
          const { data: org } = await db
            .from('organizations')
            .select('name, services, specialty')
            .eq('id', orgId)
            .maybeSingle()

          if (!org?.name) {
            return { org_id: orgId, status: 'skip', error: 'org sem nome' }
          }

          // Buscar endereco e coordenadas do gmb_profiles
          const { data: prof } = await db
            .from('professionals')
            .select('user_id')
            .eq('organization_id', orgId)
            .maybeSingle()

          let address = ''
          let lat: number | null = null
          let lng: number | null = null

          if (prof?.user_id) {
            const { data: gmbProfile } = await db
              .from('gmb_profiles')
              .select('address, latitude, longitude')
              .eq('user_id', prof.user_id)
              .maybeSingle()
            address = (gmbProfile?.address as string) ?? ''
            lat = gmbProfile?.latitude as number | null
            lng = gmbProfile?.longitude as number | null
          }

          if (!address) {
            return { org_id: orgId, status: 'skip', error: 'sem endereco' }
          }

          // 2. Gerar keywords (se nao existem)
          const { data: existingKeywords } = await db
            .from('ranking_keywords')
            .select('id, keyword, is_primary')
            .eq('organization_id', orgId)

          let keywords = existingKeywords ?? []

          if (keywords.length === 0) {
            const generated = generateKeywords({
              orgName: org.name,
              services: (org.services as string[]) ?? [],
              address,
              specialty: (org.specialty as string) ?? null,
            })

            if (generated.length === 0) {
              return { org_id: orgId, status: 'skip', error: 'sem keywords geradas' }
            }

            const payloads = generated.map(k => ({
              organization_id: orgId,
              keyword: k.keyword,
              is_primary: k.isPrimary,
              source: 'auto',
            }))

            const { data: inserted } = await db
              .from('ranking_keywords')
              .upsert(payloads, { onConflict: 'organization_id,keyword' })
              .select('id, keyword, is_primary')

            keywords = inserted ?? []
            console.log(`[ranking-tracker] Org ${orgId}: ${keywords.length} keywords geradas`)
          }

          // 3. Rastrear posicao para cada keyword
          const snapshotDate = new Date().toISOString().split('T')[0]
          let tracked = 0

          for (const kw of keywords) {
            const pos = await trackPosition(kw.keyword, org.name, lat, lng)

            await db.from('ranking_positions').upsert({
              keyword_id: kw.id,
              organization_id: orgId,
              position: pos.position,
              total_results: pos.totalResults,
              top_competitor_name: pos.topCompetitor?.name ?? null,
              top_competitor_reviews: pos.topCompetitor?.reviews ?? null,
              snapshot_date: snapshotDate,
            }, { onConflict: 'keyword_id,snapshot_date' })

            tracked++
            console.log(`[ranking-tracker] "${kw.keyword}": posicao ${pos.position ?? 'N/A'} (top: ${pos.topCompetitor?.name ?? '-'})`)
          }

          return { org_id: orgId, status: 'ok', keywords: tracked }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'unknown'
          console.error(`[ranking-tracker] Erro org ${orgId}: ${msg}`)
          return { org_id: orgId, status: 'error', error: msg }
        }
      })
      results.push(result)
    }

    console.log(`[ranking-tracker] Concluido: ${results.filter(r => r.status === 'ok').length}/${results.length} orgs`)
    return { processed: results.length, results }
  }
)
