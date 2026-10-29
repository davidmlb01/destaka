export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface DailyMetricTimeSeries {
  dailyMetric?: string
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

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('x-admin-key')
  if (authHeader !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { organization_id?: string }
  const db = admin()

  // Se nao passou org_id, busca todas as orgs com token
  if (!body.organization_id) {
    const { data: tokens } = await db.from('google_tokens').select('organization_id')
    const orgIds = (tokens ?? []).map((t: { organization_id: string }) => t.organization_id)
    const results: Array<{ org_id: string; status: string; detail?: unknown }> = []
    for (const oid of orgIds) {
      try {
        const res = await fetch(req.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': process.env.ADMIN_SECRET_KEY! },
          body: JSON.stringify({ organization_id: oid }),
        })
        const resBody = await res.json().catch(() => ({}))
        results.push({ org_id: oid, status: res.ok ? 'ok' : 'error', detail: res.ok ? undefined : resBody })
      } catch {
        results.push({ org_id: oid, status: 'error' })
      }
    }
    return NextResponse.json({ ok: true, results })
  }

  const orgId = body.organization_id

  const accessToken = await getValidTokenForOrg(db, orgId)
  if (!accessToken) {
    return NextResponse.json({ error: 'sem token Google valido' }, { status: 401 })
  }

  const { data: org } = await db
    .from('organizations')
    .select('gbp_location_id')
    .eq('id', orgId)
    .maybeSingle()

  let locationName: string = (org?.gbp_location_id as string) ?? ''
  if (!locationName) {
    return NextResponse.json({ error: 'sem gbp_location_id' }, { status: 404 })
  }

  // Performance API precisa do formato accounts/{id}/locations/{id}
  if (!locationName.startsWith('accounts/')) {
    try {
      const { GBPClient } = await import('@/lib/google/gbp-client')
      const gbp = new GBPClient(accessToken)
      const accounts = await gbp.listAccounts()
      if (accounts.length > 0) {
        const locations = await gbp.listLocations(accounts[0].name)
        const match = locations.find(l => l.name?.includes(locationName.replace('locations/', '')))
        if (match?.name) {
          locationName = match.name
          await db.from('organizations').update({ gbp_location_id: locationName }).eq('id', orgId)
        }
      }
    } catch {
      // Tenta com o formato existente
    }
  }

  // Ultimos 7 dias (ontem como fim, dados de hoje podem nao estar prontos)
  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() - 1)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 6)

  const [startYear, startMonth, startDay] = startDate.toISOString().split('T')[0].split('-').map(Number)
  const [endYear, endMonth, endDay] = endDate.toISOString().split('T')[0].split('-').map(Number)

  const apiBody = {
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

  try {
    const res = await fetch(
      `https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiBody),
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown')
      return NextResponse.json({
        error: `GBP Performance API ${res.status}`,
        detail: errText,
        locationName,
      }, { status: res.status })
    }

    const data = await res.json() as PerformanceResponse
    const series = data.multiDailyMetricTimeSeries ?? []

    let impressionsMaps = 0
    let impressionsSearch = 0
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

    // Week start (segunda-feira)
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    const weekStart = monday.toISOString().split('T')[0]

    await db.from('performance_metrics').upsert({
      organization_id: orgId,
      week_start: weekStart,
      impressions_direct: impressionsSearch,
      impressions_indirect: impressionsMaps,
      views_maps: impressionsMaps,
      views_search: impressionsSearch,
      actions_phone: actionsPhone,
      actions_directions: actionsDirections,
      actions_website: actionsWebsite,
    }, { onConflict: 'organization_id,week_start', ignoreDuplicates: false })

    return NextResponse.json({
      ok: true,
      weekStart,
      impressions: { maps: impressionsMaps, search: impressionsSearch },
      actions: { phone: actionsPhone, website: actionsWebsite, directions: actionsDirections },
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'unknown',
    }, { status: 500 })
  }
}
