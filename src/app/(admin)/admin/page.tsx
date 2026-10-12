export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui/Logo'
import { RetriggerButton } from './RetriggerButton'
import { MrrLeadsChart, ScoreEvolutionChart } from './AdminCharts'
import { TopMovers } from './TopMovers'
import { Attribution } from './Attribution'

interface OrgRow {
  id: string
  name: string
  specialty: string
  subscription_status: string | null
  lgpd_ai_consent: boolean | null
  created_at: string
  utm_source: string | null
}

interface ScoreRow {
  organization_id: string
  total: number
  faixa: string
  snapshot_date: string
}

interface TokenRow {
  organization_id: string
  updated_at: string | null
}

interface LeadRow {
  id: string
  email: string
  place_name: string | null
  score: number | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: string
}

async function getAdminData() {
  const db = await createServiceClient()

  const [
    { data: orgs },
    { data: scores },
    { data: pendingResponses },
    { data: pendingPosts },
    { data: tokens },
    { data: leads },
    { data: allLeads },
  ] = await Promise.all([
    db.from('organizations').select('id, name, specialty, subscription_status, lgpd_ai_consent, created_at, utm_source'),
    db.from('scores').select('organization_id, total, faixa, snapshot_date').order('snapshot_date', { ascending: false }),
    db.from('review_responses').select('organization_id').eq('status', 'pending'),
    db.from('posts').select('organization_id').eq('status', 'pending'),
    db.from('google_tokens').select('organization_id, updated_at'),
    db.from('leads').select('id, email, place_name, score, utm_source, utm_medium, utm_campaign, created_at').order('created_at', { ascending: false }).limit(20),
    db.from('leads').select('id, utm_source, created_at'),
  ])

  const safeOrgs = (orgs ?? []) as OrgRow[]
  const safeScores = (scores ?? []) as ScoreRow[]
  const safeLeads = (leads ?? []) as LeadRow[]
  const safeAllLeads = (allLeads ?? []) as Array<{ id: string; utm_source: string | null; created_at: string }>

  // Scores by org (latest 2 for trend)
  const scoresByOrg: Record<string, ScoreRow[]> = {}
  for (const s of safeScores) {
    if (!scoresByOrg[s.organization_id]) scoresByOrg[s.organization_id] = []
    if (scoresByOrg[s.organization_id].length < 2) scoresByOrg[s.organization_id].push(s)
  }

  // All scores by org (for evolution)
  const allScoresByOrg: Record<string, ScoreRow[]> = {}
  for (const s of safeScores) {
    if (!allScoresByOrg[s.organization_id]) allScoresByOrg[s.organization_id] = []
    allScoresByOrg[s.organization_id].push(s)
  }

  // Token status
  const tokenByOrg: Record<string, { hasToken: boolean; updatedAt: string | null }> = {}
  for (const t of (tokens ?? []) as TokenRow[]) {
    tokenByOrg[t.organization_id] = { hasToken: true, updatedAt: t.updated_at }
  }

  // Pending counts
  const pendingByOrg: Record<string, number> = {}
  for (const r of pendingResponses ?? []) {
    pendingByOrg[(r as { organization_id: string }).organization_id] = (pendingByOrg[(r as { organization_id: string }).organization_id] ?? 0) + 1
  }
  for (const p of pendingPosts ?? []) {
    pendingByOrg[(p as { organization_id: string }).organization_id] = (pendingByOrg[(p as { organization_id: string }).organization_id] ?? 0) + 1
  }

  // === MRR by month (on-the-fly) ===
  const mrrByMonth = computeMrrByMonth(safeOrgs)

  // === Leads by month ===
  const leadsByMonth = computeLeadsByMonth(safeAllLeads)

  // Merge MRR + Leads into chart data
  const allMonths = [...new Set([...Object.keys(mrrByMonth), ...Object.keys(leadsByMonth)])].sort()
  const last6 = allMonths.slice(-6)
  const mrrLeadsData = last6.map(m => ({
    month: formatMonth(m),
    mrr: mrrByMonth[m] ?? 0,
    leads: leadsByMonth[m] ?? 0,
  }))

  // === Score evolution by month ===
  const scoreEvolution = computeScoreEvolution(safeScores)

  // === Top movers (this week) ===
  const topMovers = computeTopMovers(safeOrgs, allScoresByOrg)

  // === Attribution ===
  const attribution = computeAttribution(safeAllLeads, safeOrgs)

  // === Activation rate ===
  const activatedCount = safeOrgs.filter(o => o.lgpd_ai_consent !== null).length
  const activationRate = safeOrgs.length > 0 ? Math.round((activatedCount / safeOrgs.length) * 100) : 0

  // === Churn estimate ===
  const cancelledCount = safeOrgs.filter(o => o.subscription_status === 'cancelled').length
  const everPaidCount = safeOrgs.filter(o => o.subscription_status === 'active' || o.subscription_status === 'cancelled').length
  const churnRate = everPaidCount > 0 ? Math.round((cancelledCount / everPaidCount) * 100) : 0

  // === Lead to paying conversion ===
  const payingCount = safeOrgs.filter(o => o.subscription_status === 'active').length
  const leadToPayingRate = safeAllLeads.length > 0 ? Math.round((payingCount / safeAllLeads.length) * 100) : 0

  return {
    orgs: safeOrgs,
    scoresByOrg,
    pendingByOrg,
    tokenByOrg,
    leads: safeLeads,
    mrrLeadsData,
    scoreEvolution,
    topMovers,
    attribution,
    activationRate,
    churnRate,
    leadToPayingRate,
  }
}

function computeMrrByMonth(orgs: OrgRow[]) {
  const result: Record<string, number> = {}
  const now = new Date()

  for (const org of orgs) {
    if (org.subscription_status !== 'active') continue
    const start = new Date(org.created_at)
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      result[key] = (result[key] ?? 0) + 197
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }
  return result
}

function computeLeadsByMonth(leads: Array<{ created_at: string }>) {
  const result: Record<string, number> = {}
  for (const l of leads) {
    const d = new Date(l.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    result[key] = (result[key] ?? 0) + 1
  }
  return result
}

function computeScoreEvolution(scores: ScoreRow[]) {
  const byMonth: Record<string, { sum: number; count: number }> = {}
  for (const s of scores) {
    const d = new Date(s.snapshot_date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = { sum: 0, count: 0 }
    byMonth[key].sum += s.total
    byMonth[key].count += 1
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, v]) => ({
      month: formatMonth(key),
      avgScore: Math.round(v.sum / v.count),
      clients: v.count,
    }))
}

function computeTopMovers(orgs: OrgRow[], allScoresByOrg: Record<string, ScoreRow[]>) {
  const movers: Array<{ name: string; scoreBefore: number; scoreAfter: number; delta: number; faixa: string }> = []

  for (const org of orgs) {
    const orgScores = allScoresByOrg[org.id]
    if (!orgScores || orgScores.length < 2) continue

    const latest = orgScores[0]
    const previous = orgScores[1]
    const delta = latest.total - previous.total

    if (delta === 0) continue

    movers.push({
      name: org.name,
      scoreBefore: previous.total,
      scoreAfter: latest.total,
      delta,
      faixa: latest.faixa,
    })
  }

  return movers
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5)
}

function computeAttribution(
  leads: Array<{ utm_source: string | null }>,
  orgs: OrgRow[]
) {
  const leadsBySource: Record<string, number> = {}
  const convBySource: Record<string, number> = {}

  for (const l of leads) {
    const src = l.utm_source ?? 'organico'
    leadsBySource[src] = (leadsBySource[src] ?? 0) + 1
  }

  for (const o of orgs) {
    if (o.subscription_status !== 'active') continue
    const src = o.utm_source ?? 'organico'
    convBySource[src] = (convBySource[src] ?? 0) + 1
  }

  const allSources = [...new Set([...Object.keys(leadsBySource), ...Object.keys(convBySource)])]
  return allSources
    .map(source => {
      const ld = leadsBySource[source] ?? 0
      const cv = convBySource[source] ?? 0
      return {
        source,
        leads: ld,
        conversions: cv,
        rate: ld > 0 ? Math.round((cv / ld) * 100) : 0,
      }
    })
    .sort((a, b) => b.leads - a.leads)
}

function formatMonth(key: string) {
  const [y, m] = key.split('-')
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatDateFull(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isTokenStale(updatedAt: string | null): boolean {
  if (!updatedAt) return true
  const diff = Date.now() - new Date(updatedAt).getTime()
  return diff > 7 * 24 * 60 * 60 * 1000
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

const FAIXA_STYLE: Record<string, { bg: string; text: string }> = {
  fraca: { bg: 'var(--error-bg)', text: 'var(--error)' },
  funcional: { bg: 'var(--warning-bg)', text: 'var(--warning)' },
  forte: { bg: 'var(--success-bg)', text: 'var(--success)' },
  perfeita: { bg: 'var(--accent-bg)', text: 'var(--accent-bright)' },
}

const FAIXA_LABEL: Record<string, string> = {
  fraca: 'Fraca',
  funcional: 'Funcional',
  forte: 'Forte',
  perfeita: 'Perfeita',
}

const SUB_STYLE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  active: { bg: 'var(--success-bg)', border: 'var(--success-border)', text: 'var(--success)', label: 'Pagante' },
  cancelled: { bg: 'var(--error-bg)', border: 'var(--error-border)', text: 'var(--error)', label: 'Cancelado' },
  free: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', text: 'var(--text-muted)', label: 'Free' },
}

export default async function AdminPage() {
  const {
    orgs, scoresByOrg, pendingByOrg, tokenByOrg, leads,
    mrrLeadsData, scoreEvolution, topMovers, attribution,
    activationRate, churnRate, leadToPayingRate,
  } = await getAdminData()

  const totalPending = Object.values(pendingByOrg).reduce((a, b) => a + b, 0)
  const payingOrgs = orgs.filter(o => o.subscription_status === 'active')
  const mrr = payingOrgs.length * 197
  const freeOrgs = orgs.filter(o => o.subscription_status !== 'active' && o.subscription_status !== 'cancelled')
  const cancelledOrgs = orgs.filter(o => o.subscription_status === 'cancelled')
  const brokenTokens = orgs.filter(o => {
    const t = tokenByOrg[o.id]
    return !t?.hasToken || isTokenStale(t.updatedAt)
  })
  const avgScore = Object.values(scoresByOrg).length > 0
    ? Math.round(Object.values(scoresByOrg).reduce((s, arr) => s + (arr[0]?.total ?? 0), 0) / Object.values(scoresByOrg).length)
    : 0
  const ltv = churnRate > 0 ? Math.round(197 / (churnRate / 100)) : 0

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <h1 className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            {brokenTokens.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error-border)' }}>
                {brokenTokens.length} token{brokenTokens.length > 1 ? 's' : ''} com problema
              </span>
            )}
            {totalPending > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
                {totalPending} pendentes
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Row 1: Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard value={`R$${mrr.toLocaleString('pt-BR')}`} label="MRR" color="var(--accent)" />
          <StatCard value={payingOrgs.length} label="pagantes" color="var(--success)" />
          <StatCard value={freeOrgs.length} label="free" />
          <StatCard value={avgScore} label="score medio" />
          <StatCard value={`${activationRate}%`} label="ativacao" color={activationRate > 50 ? 'var(--success)' : 'var(--warning)'} />
          <StatCard value={`${churnRate}%`} label="churn" color={churnRate > 5 ? 'var(--error)' : 'var(--success)'} />
          <StatCard value={ltv > 0 ? `R$${ltv.toLocaleString('pt-BR')}` : '-'} label="LTV est." color="var(--accent-bright)" />
          <StatCard value={brokenTokens.length} label="tokens" color={brokenTokens.length > 0 ? 'var(--error)' : undefined} />
        </div>

        {/* Row 2: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MrrLeadsChart data={mrrLeadsData} />
          <ScoreEvolutionChart data={scoreEvolution} />
        </div>

        {/* Row 3: Top Movers + Attribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopMovers movers={topMovers} />
          <Attribution channels={attribution} />
        </div>

        {/* Row 4: Clientes */}
        <section className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Clientes ({orgs.length})</h2>
            <div className="flex gap-2 text-xs">
              <span style={{ color: 'var(--success)' }} className="font-semibold">{payingOrgs.length} pagantes</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: 'var(--text-tertiary)' }}>{freeOrgs.length} free</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: 'var(--text-tertiary)' }}>{leadToPayingRate}% lead→pagante</span>
              {cancelledOrgs.length > 0 && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span style={{ color: 'var(--error)' }}>{cancelledOrgs.length} cancelados</span>
                </>
              )}
            </div>
          </div>

          {orgs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum cliente cadastrado ainda.</p>
            </div>
          ) : (
            <div>
              {orgs.map((org, i) => {
                const scoreArr = scoresByOrg[org.id]
                const current = scoreArr?.[0]
                const previous = scoreArr?.[1]
                const delta = current && previous ? current.total - previous.total : null
                const pending = pendingByOrg[org.id] ?? 0
                const token = tokenByOrg[org.id]
                const tokenBroken = !token?.hasToken || isTokenStale(token.updatedAt)
                const subStatus = org.subscription_status ?? 'free'
                const sub = SUB_STYLE[subStatus] ?? SUB_STYLE.free
                const faixa = current ? (FAIXA_STYLE[current.faixa] ?? { bg: 'rgba(255,255,255,0.06)', text: 'var(--text-muted)' }) : null
                const lastScoreDate = current?.snapshot_date
                const daysSinceScore = lastScoreDate ? daysSince(lastScoreDate) : null
                const isAtRisk = (delta !== null && delta < 0) || (daysSinceScore !== null && daysSinceScore > 14) || tokenBroken

                return (
                  <div
                    key={org.id}
                    className="px-6 py-4 flex items-center justify-between gap-4"
                    style={i > 0 ? { borderTop: '1px solid var(--border-subtle)' } : undefined}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isAtRisk && (
                          <span className="shrink-0 flex items-center gap-1" role="status">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--error)' }} aria-hidden="true" />
                            <span className="sr-only">Cliente em risco</span>
                          </span>
                        )}
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{org.name}</p>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: sub.bg, color: sub.text, border: `1px solid ${sub.border}` }}>
                          {sub.label}
                        </span>
                        {tokenBroken && (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error-border)' }}>
                            Token
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {org.specialty}
                        {org.utm_source && <><span aria-hidden="true"> · </span>via {org.utm_source}</>}
                        <span aria-hidden="true"> · </span>{formatDate(org.created_at)}
                        {!org.lgpd_ai_consent && <><span aria-hidden="true"> · </span>sem onboarding</>}
                        {daysSinceScore !== null && <><span aria-hidden="true"> · </span>score {daysSinceScore}d atras</>}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {pending > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
                          {pending}
                        </span>
                      )}
                      {current ? (
                        <div className="text-right flex items-center gap-1.5">
                          <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{current.total}</span>
                          {delta !== null && delta !== 0 && (
                            <span className="text-xs font-bold" style={{ color: delta > 0 ? 'var(--success)' : 'var(--error)' }}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: faixa!.bg, color: faixa!.text }}>
                            {FAIXA_LABEL[current.faixa] ?? current.faixa}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>sem score</span>
                      )}
                      <RetriggerButton orgId={org.id} orgName={org.name} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Row 5: Tokens com problema */}
        {brokenTokens.length > 0 && (
          <section className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-subtle)', border: '1px solid var(--error-border)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--error-border)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--error)' }}>Tokens com problema ({brokenTokens.length})</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Clientes com entrega parada. Automacoes nao estao funcionando.</p>
            </div>
            <div>
              {brokenTokens.map((org, i) => {
                const t = tokenByOrg[org.id]
                return (
                  <div key={org.id} className="px-6 py-3 flex items-center justify-between" style={i > 0 ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{org.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {!t?.hasToken ? 'Sem token Google' : `Ultima atualizacao: ${t.updatedAt ? formatDateFull(t.updatedAt) : 'nunca'}`}
                      </p>
                    </div>
                    <RetriggerButton orgId={org.id} orgName={org.name} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Row 6: Ultimos leads */}
        <section className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Ultimos leads ({leads.length})</h2>
          </div>
          {leads.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum lead capturado ainda.</p>
            </div>
          ) : (
            <>
            <p className="text-[10px] px-6 py-1 md:hidden" style={{ color: 'var(--text-muted)' }}>← Deslize para ver mais →</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Negocio</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Score</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Fonte</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr key={lead.id} style={i > 0 ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
                      <td className="px-6 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>{lead.email}</td>
                      <td className="px-4 py-2.5 truncate max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>{lead.place_name ?? '-'}</td>
                      <td className="px-4 py-2.5">
                        {lead.score !== null ? (
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{lead.score}</span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        {lead.utm_source ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: 'var(--accent-bg)', color: 'var(--accent-bright)', border: '1px solid var(--accent-border)' }}>
                            {lead.utm_source}{lead.utm_medium ? `/${lead.utm_medium}` : ''}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>organico</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{formatDateFull(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>

      </div>
    </main>
  )
}

function StatCard({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
      <p className="text-xl font-black" style={{ color: color ?? 'var(--text-primary)' }}>{value}</p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}
