// Story 6.6: Snapshot Semanal de Keywords — coleta search keywords da GBP Performance API
// Cron: toda segunda-feira as 07:00 UTC (apos geo-collector)

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { GBPClient } from '@/lib/google/gbp-client'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const keywordSnapshot = inngest.createFunction(
  {
    id: 'keyword-snapshot',
    triggers: [
      { cron: '0 7 * * 1' },
      { event: 'destaka/keywords.snapshot.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const eventData = (event as unknown as { data?: { organization_id?: string } }).data
      if (event.name === 'destaka/keywords.snapshot.requested' && eventData?.organization_id) {
        return [eventData.organization_id]
      }
      const { data } = await db
        .from('google_tokens')
        .select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; status: string; keywords?: number; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`keyword-snap-${orgId}`, async () => {
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

          const { data: profile } = await db
            .from('gbp_profiles')
            .select('id')
            .eq('organization_id', orgId)
            .maybeSingle()

          if (!profile) {
            return { org_id: orgId, status: 'skip', error: 'sem perfil GBP' }
          }

          const GBP_LOCATION_PATTERN = /^(accounts\/\d+\/)?locations\/\d+$/
          if (!GBP_LOCATION_PATTERN.test(org.gbp_location_id)) {
            return { org_id: orgId, status: 'skip', error: 'gbp_location_id formato invalido' }
          }

          const gbpClient = new GBPClient(validToken)
          const keywords = await gbpClient.getSearchKeywords(org.gbp_location_id)

          if (!keywords?.length) {
            console.log(`[keyword-snapshot] Sem keywords para org ${orgId}`)
            return { org_id: orgId, status: 'ok', keywords: 0 }
          }

          // Top 20 keywords
          const top20 = keywords.slice(0, 20)

          // Calcular week_start (segunda-feira da semana atual)
          const now = new Date()
          const dayOfWeek = now.getDay()
          const monday = new Date(now)
          monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
          const weekStart = monday.toISOString().split('T')[0]

          // Inserir uma row por keyword
          const rows = top20.map(kw => ({
            org_id: orgId,
            profile_id: profile.id,
            keyword: kw.keyword,
            impressions: kw.impressions,
            clicks: 0,
            week_start: weekStart,
          }))

          const { error: insertError } = await db
            .from('keyword_snapshots')
            .upsert(rows, { onConflict: 'org_id,week_start,keyword', ignoreDuplicates: false })

          if (insertError) {
            console.log(`[keyword-snapshot] Erro ao inserir keywords org ${orgId}`)
            return { org_id: orgId, status: 'error', error: 'insert failed' }
          }

          console.log(`[keyword-snapshot] Snapshot salvo para org ${orgId}: ${top20.length} keywords`)
          return { org_id: orgId, status: 'ok', keywords: top20.length }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'unknown'
          console.log(`[keyword-snapshot] Erro org ${orgId}: ${msg}`)
          return { org_id: orgId, status: 'error', error: msg }
        }
      })
      results.push(result)
    }

    console.log(`[keyword-snapshot] Concluido: ${results.filter(r => r.status === 'ok').length}/${results.length} orgs`)
    return { processed: results.length, results }
  }
)
