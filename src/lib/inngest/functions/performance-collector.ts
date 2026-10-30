// EPIC-008: Coleta semanal de metricas de performance do GBP
// Cron: toda segunda-feira as 08:00 UTC (apos geo-collector)
// Tambem aceita trigger manual via evento

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'
import { GBPClient } from '@/lib/google/gbp-client'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface DailyMetricTimeSeries {
  dailyMetric?: string
  dailySubEntityType?: string
  timeSeries?: {
    datedValues?: Array<{
      date?: { year: number; month: number; day: number }
      value?: string
    }>
  }
}

interface PerformanceResponse {
  multiDailyMetricTimeSeries?: DailyMetricTimeSeries[]
}

export const performanceCollector = inngest.createFunction(
  {
    id: 'performance-collector',
    triggers: [
      { cron: '0 8 * * 1' },
      { event: 'destaka/performance.collect.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const eventData = (event as unknown as { data?: { organization_id?: string } }).data
      if (event.name === 'destaka/performance.collect.requested' && eventData?.organization_id) {
        return [eventData.organization_id]
      }
      const { data } = await db
        .from('google_tokens')
        .select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; status: string; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`perf-collect-${orgId}`, async () => {
        try {
          const accessToken = await getValidTokenForOrg(db, orgId)
          if (!accessToken) {
            return { org_id: orgId, status: 'skip', error: 'sem token valido' }
          }

          // Buscar gbp_location_id da org
          const { data: org } = await db
            .from('organizations')
            .select('gbp_location_id')
            .eq('id', orgId)
            .maybeSingle()

          let locationName: string = (org?.gbp_location_id as string) ?? ''
          if (!locationName) {
            return { org_id: orgId, status: 'skip', error: 'sem gbp_location_id' }
          }

          // Performance API precisa do formato accounts/{id}/locations/{id}
          // Se so tem locations/{id}, busca o account via GBP API
          if (!locationName.startsWith('accounts/')) {
            try {
              const gbp = new GBPClient(accessToken)
              const accounts = await gbp.listAccounts()
              if (accounts.length > 0) {
                const accountName = accounts[0].name
                const locations = await gbp.listLocations(accountName)
                const match = locations.find(l => l.name?.includes(locationName.replace('locations/', '')))
                if (match?.name) {
                  locationName = match.name
                  // Atualiza gbp_location_id para o formato completo
                  await db.from('organizations').update({ gbp_location_id: locationName }).eq('id', orgId)
                }
              }
            } catch {
              // Se falhar, tenta com o formato que tem
            }
          }

          // Datas: ultimos 7 dias
          const now = new Date()
          const endDate = new Date(now)
          endDate.setDate(endDate.getDate() - 1) // ontem (dados de hoje podem nao estar prontos)
          const startDate = new Date(endDate)
          startDate.setDate(startDate.getDate() - 6) // 7 dias totais

          const [startYear, startMonth, startDay] = startDate.toISOString().split('T')[0].split('-').map(Number)
          const [endYear, endMonth, endDay] = endDate.toISOString().split('T')[0].split('-').map(Number)

          const body = {
            dailyMetrics: [
              'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
              'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
              'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
              'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
              'CALL_CLICKS',
              'WEBSITE_CLICKS',
              'BUSINESS_DIRECTION_REQUESTS',
            ],
            dailyRange: {
              startDate: { year: startYear, month: startMonth, day: startDay },
              endDate: { year: endYear, month: endMonth, day: endDay },
            },
          }

          // Tenta ambos os formatos: locations/ID e accounts/X/locations/Y
          const locationId = locationName.includes('/locations/')
            ? locationName.split('/locations/')[1]
            : locationName.replace('locations/', '')
          const formats = [
            `locations/${locationId}`,
            locationName,
          ]

          let res: Response | null = null
          let usedFormat = ''
          for (const fmt of formats) {
            const attempt = await fetch(
              `https://businessprofileperformance.googleapis.com/v1/${fmt}:fetchMultiDailyMetricsTimeSeries`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(30000),
              }
            )
            if (attempt.ok) {
              res = attempt
              usedFormat = fmt
              break
            }
            // Se 404, tenta próximo formato. Se outro erro, para.
            if (attempt.status !== 404) {
              const errText = await attempt.text().catch(() => 'unknown')
              console.log(`[performance-collector] API ${attempt.status} org ${orgId}: ${errText}`)
              return { org_id: orgId, status: 'error', error: `API ${attempt.status}` }
            }
          }

          if (!res) {
            console.log(`[performance-collector] 404 em ambos os formatos para org ${orgId}`)
            return { org_id: orgId, status: 'error', error: 'API 404 em ambos os formatos de location' }
          }

          console.log(`[performance-collector] OK com formato ${usedFormat} para org ${orgId}`)

          const data = await res.json() as PerformanceResponse
          const series = data.multiDailyMetricTimeSeries ?? []

          // Agregar valores diarios em totais semanais
          let impressionsMaps = 0
          let impressionsSearch = 0
          let viewsMaps = 0
          let viewsSearch = 0
          let actionsPhone = 0
          let actionsWebsite = 0
          let actionsDirections = 0

          for (const s of series) {
            const metric = s.dailyMetric ?? ''
            const total = (s.timeSeries?.datedValues ?? [])
              .reduce((sum, dv) => sum + (parseInt(dv.value ?? '0', 10) || 0), 0)

            if (metric === 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS' || metric === 'BUSINESS_IMPRESSIONS_MOBILE_MAPS') {
              impressionsMaps += total
            } else if (metric === 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH' || metric === 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH') {
              impressionsSearch += total
            } else if (metric === 'CALL_CLICKS') {
              actionsPhone = total
            } else if (metric === 'WEBSITE_CLICKS') {
              actionsWebsite = total
            } else if (metric === 'BUSINESS_DIRECTION_REQUESTS') {
              actionsDirections = total
            }
          }

          // Maps views = impressions from Maps, Search views = impressions from Search
          viewsMaps = impressionsMaps
          viewsSearch = impressionsSearch

          const weekStart = getWeekStart()

          await db.from('performance_metrics').upsert({
            organization_id: orgId,
            week_start: weekStart,
            impressions_direct: impressionsSearch,
            impressions_indirect: impressionsMaps,
            views_maps: viewsMaps,
            views_search: viewsSearch,
            actions_phone: actionsPhone,
            actions_directions: actionsDirections,
            actions_website: actionsWebsite,
          }, { onConflict: 'organization_id,week_start', ignoreDuplicates: false })

          const totalImpressions = impressionsMaps + impressionsSearch
          const totalActions = actionsPhone + actionsDirections + actionsWebsite
          console.log(`[performance-collector] org ${orgId}: ${totalImpressions} impressoes, ${totalActions} acoes`)
          return { org_id: orgId, status: 'ok' }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'unknown'
          console.log(`[performance-collector] Erro org ${orgId}: ${msg}`)
          return { org_id: orgId, status: 'error', error: msg }
        }
      })
      results.push(result)
    }

    console.log(`[performance-collector] Concluido: ${results.filter(r => r.status === 'ok').length}/${results.length} orgs`)
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
