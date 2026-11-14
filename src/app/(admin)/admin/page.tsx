export const dynamic = 'force-dynamic'

import './admin-tokens.css'
import { createServiceClient } from '@/lib/supabase/server'
import { RetriggerButton } from './RetriggerButton'
import { MrrLeadsChart, ScoreEvolutionChart, ConversionDonutChart } from './AdminCharts'
import { TopMovers } from './TopMovers'
import { Attribution } from './Attribution'
import { AdminSidebar } from './AdminSidebar'
import { AdminAlertBar } from './AdminAlertBar'
import { getPageViews } from '@/lib/analytics/ga4'

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

  // === GA4 traffic (graceful fallback) ===
  const ga4PropertyId = process.env.GA4_PROPERTY_ID ?? ''
  let ga4Data: Awaited<ReturnType<typeof getPageViews>> = null
  if (ga4PropertyId) {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const endDate = now.toISOString().slice(0, 10)
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10)
    ga4Data = await getPageViews(ga4PropertyId, startDate, endDate)
  }

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
    ga4Data,
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
  fraca:     { bg: 'var(--admin-error-bg)',   text: 'var(--admin-error)'   },
  funcional: { bg: 'var(--admin-warning-bg)', text: 'var(--admin-warning)' },
  forte:     { bg: 'var(--admin-success-bg)', text: 'var(--admin-success)' },
  perfeita:  { bg: 'rgba(142,182,155,0.15)',  text: 'var(--admin-accent-bright)' },
}

const FAIXA_LABEL: Record<string, string> = {
  fraca: 'Fraca',
  funcional: 'Funcional',
  forte: 'Forte',
  perfeita: 'Perfeita',
}

const SUB_STYLE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  active:    { bg: 'var(--admin-success-bg)', border: 'var(--admin-success-border)', text: 'var(--admin-success)', label: 'Pagante' },
  cancelled: { bg: 'var(--admin-error-bg)',   border: 'var(--admin-error-border)',   text: 'var(--admin-error)',   label: 'Cancelado' },
  free:      { bg: 'rgba(142,182,155,0.08)',  border: 'rgba(142,182,155,0.15)',      text: 'var(--admin-text-muted)', label: 'Free' },
}

// --- KPI icon components ---

function DollarSignIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function TrendingDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function UserPlusSmallIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

// --- StatCard ---

interface StatCardProps {
  value: string | number
  label: string
  icon: React.ReactNode
  iconColor: string
  alert?: boolean
  highlight?: boolean
  sparkline?: number[]
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 60
  const h = 24
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  })
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`spk-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatCard({ value, label, icon, iconColor, alert = false, highlight = false, sparkline }: StatCardProps) {
  let bg = 'var(--admin-bg-card)'
  let grad = 'var(--admin-gradient-card)'
  let border = 'var(--admin-border-card)'

  if (alert) {
    bg = 'var(--admin-error-bg)'
    grad = 'none'
    border = 'var(--admin-error-border)'
  } else if (highlight) {
    bg = 'var(--admin-bg-card)'
    grad = 'var(--admin-gradient-mrr)'
    border = 'rgba(20,184,166,0.3)'
  }

  return (
    <div
      className="admin-card-hover"
      style={{
        padding: 24,
        borderRadius: 20,
        background: bg,
        backgroundImage: grad,
        border: `1px solid ${border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: 'var(--admin-shadow-md)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: alert ? 'rgba(248,113,113,0.2)' : `${iconColor}28`,
          border: `1px solid ${alert ? 'rgba(248,113,113,0.3)' : `${iconColor}30`}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--admin-text-heading)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
        {sparkline && sparkline.length >= 2 && (
          <div style={{ marginTop: 10, opacity: 0.7 }}>
            <Sparkline values={sparkline} color={iconColor} />
          </div>
        )}
      </div>
    </div>
  )
}

export default async function AdminPage() {
  const {
    orgs, scoresByOrg, pendingByOrg, tokenByOrg, leads,
    mrrLeadsData, scoreEvolution, topMovers, attribution,
    activationRate, churnRate, leadToPayingRate, ga4Data,
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

  const mrrSparkline = mrrLeadsData.map(d => d.mrr)
  const leadsSparkline = mrrLeadsData.map(d => d.leads)
  const scoreSparkline = scoreEvolution.map(d => d.avgScore)

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--admin-bg-deep)',
        backgroundImage: 'var(--admin-gradient-bg)',
      }}
    >
      {/* Sidebar */}
      <AdminSidebar
        brokenTokensCount={brokenTokens.length}
        totalPending={totalPending}
      />

      {/* Content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Alert bar */}
        <AdminAlertBar
          brokenTokensCount={brokenTokens.length}
          totalPending={totalPending}
        />

        <main style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Secao 1: KPI Cards */}
          <section id="overview" aria-labelledby="overview-heading">
            <h2
              id="overview-heading"
              style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}
            >
              Visao Geral
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
              }}
              className="kpi-grid"
            >
              <StatCard
                value={`R$${mrr.toLocaleString('pt-BR')}`}
                label="MRR"
                icon={<DollarSignIcon />}
                iconColor="#14B8A6"
                highlight
                sparkline={mrrSparkline}
              />
              <StatCard
                value={payingOrgs.length}
                label="Pagantes"
                icon={<CreditCardIcon />}
                iconColor="var(--admin-success)"
              />
              <StatCard
                value={avgScore}
                label="Score medio"
                icon={<StarIcon />}
                iconColor="var(--admin-accent)"
                sparkline={scoreSparkline}
              />
              <StatCard
                value={`${activationRate}%`}
                label="Ativacao"
                icon={<ZapIcon />}
                iconColor={activationRate > 50 ? 'var(--admin-success)' : 'var(--admin-warning)'}
              />
              <StatCard
                value={`${churnRate}%`}
                label="Churn"
                icon={<TrendingDownIcon />}
                iconColor={churnRate > 5 ? 'var(--admin-error)' : 'var(--admin-success)'}
              />
              <StatCard
                value={ltv > 0 ? `R$${ltv.toLocaleString('pt-BR')}` : '-'}
                label="LTV estimado"
                icon={<TargetIcon />}
                iconColor="var(--admin-accent-bright)"
              />
              <StatCard
                value={leads.length}
                label="Ultimos leads"
                icon={<UserPlusSmallIcon />}
                iconColor="#FBBF24"
                sparkline={leadsSparkline}
              />
              <StatCard
                value={brokenTokens.length}
                label="Tokens"
                icon={<KeyIcon />}
                iconColor={brokenTokens.length > 0 ? 'var(--admin-error)' : 'var(--admin-text-muted)'}
                alert={brokenTokens.length > 0}
              />
            </div>
          </section>

          {/* Secao 2: Charts */}
          <section aria-label="Graficos de desempenho">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr',
                gap: 16,
              }}
              className="charts-grid"
            >
              <MrrLeadsChart data={mrrLeadsData} />
              <ScoreEvolutionChart data={scoreEvolution} />
              <ConversionDonutChart
                payingOrgs={payingOrgs.length}
                freeOrgs={freeOrgs.length}
                cancelledOrgs={cancelledOrgs.length}
                leadToPayingRate={leadToPayingRate}
              />
            </div>
          </section>

          {/* Secao 3: Top Movers + Attribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="movers-grid">
            <TopMovers movers={topMovers} />
            <Attribution channels={attribution} />
          </div>

          {/* Secao 4: Trafego do site (GA4) */}
          <section id="traffic" className="rounded-2xl overflow-hidden" style={{ background: 'var(--admin-bg-card)', backgroundImage: 'var(--admin-gradient-card)', border: '1px solid var(--admin-border-card)', boxShadow: 'var(--admin-shadow-md)' }} aria-labelledby="traffic-heading">
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
              <h2 id="traffic-heading" className="font-semibold" style={{ color: 'var(--admin-text-heading)' }}>Trafego do site</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>Page views dos ultimos 30 dias (GA4)</p>
            </div>
            {ga4Data ? (
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['/', '/diagnostico', '/login', '/dashboard'].map(path => {
                    const row = ga4Data.find(r => r.pagePath === path)
                    return (
                      <div key={path} className="rounded-xl px-4 py-3" style={{ background: 'var(--admin-bg-card-alt)', border: '1px solid var(--admin-border-subtle)' }}>
                        <p className="text-xs font-mono truncate" style={{ color: 'var(--admin-text-muted)' }}>{path}</p>
                        <p className="text-lg font-bold mt-1" style={{ color: 'var(--admin-text-primary)' }}>
                          {row ? row.screenPageViews.toLocaleString('pt-BR') : '0'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>Configure GA4_SERVICE_ACCOUNT_KEY para ver dados de trafego.</p>
              </div>
            )}
          </section>

          {/* Secao 5: Clientes */}
          <section id="clients" className="rounded-2xl overflow-hidden" style={{ background: 'var(--admin-bg-card)', backgroundImage: 'var(--admin-gradient-card)', border: '1px solid var(--admin-border-card)', boxShadow: 'var(--admin-shadow-md)' }} aria-labelledby="clients-heading">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
              <h2 id="clients-heading" className="font-semibold" style={{ color: 'var(--admin-text-heading)' }}>Clientes ({orgs.length})</h2>
              <div className="flex gap-2 text-xs flex-wrap">
                <span style={{ color: 'var(--admin-success)' }} className="font-semibold">{payingOrgs.length} pagantes</span>
                <span style={{ color: 'var(--admin-text-muted)' }}>|</span>
                <span style={{ color: 'var(--admin-text-secondary)' }}>{freeOrgs.length} free</span>
                <span style={{ color: 'var(--admin-text-muted)' }}>|</span>
                <span style={{ color: 'var(--admin-text-secondary)' }}>{leadToPayingRate}% lead para pagante</span>
                {cancelledOrgs.length > 0 && (
                  <>
                    <span style={{ color: 'var(--admin-text-muted)' }}>|</span>
                    <span style={{ color: 'var(--admin-error)' }}>{cancelledOrgs.length} cancelados</span>
                  </>
                )}
              </div>
            </div>

            {orgs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>Nenhum cliente cadastrado ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(35,83,71,0.5)' }}>
                      <th className="px-6 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>Status</th>
                      <th className="px-4 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Cliente</th>
                      <th className="px-4 py-3 text-right" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Score</th>
                      <th className="px-4 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Faixa</th>
                      <th className="px-4 py-3 text-right" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Delta</th>
                      <th className="px-4 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>Ultimo score</th>
                      <th className="px-4 py-3 text-center" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
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
                      const faixa = current ? (FAIXA_STYLE[current.faixa] ?? { bg: 'rgba(142,182,155,0.1)', text: 'var(--admin-text-muted)' }) : null
                      const lastScoreDate = current?.snapshot_date
                      const daysSinceScore = lastScoreDate ? daysSince(lastScoreDate) : null
                      const isAtRisk = (delta !== null && delta < 0) || (daysSinceScore !== null && daysSinceScore > 14) || tokenBroken

                      return (
                        <tr
                          key={org.id}
                          className="admin-row-hover" style={i > 0 ? { borderTop: "1px solid var(--admin-border-subtle)" } : undefined}
                          
                          
                        >
                          {/* Status */}
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{ background: sub.bg, color: sub.text, border: `1px solid ${sub.border}` }}
                              >
                                {sub.label}
                              </span>
                              {tokenBroken && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                  style={{ background: 'var(--admin-error-bg)', color: 'var(--admin-error)', border: '1px solid var(--admin-error-border)' }}
                                  title="Token Google invalido ou desatualizado"
                                >
                                  Token
                                </span>
                              )}
                              {pending > 0 && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                  style={{ background: 'var(--admin-warning-bg)', color: 'var(--admin-warning)', border: '1px solid var(--admin-warning-border)' }}
                                >
                                  {pending} pend.
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Cliente */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isAtRisk && (
                                <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--admin-error)' }} role="status" aria-label="Cliente em risco" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--admin-text-primary)' }}>{org.name}</p>
                                <p className="text-xs truncate" style={{ color: 'var(--admin-text-muted)' }}>
                                  {org.specialty}
                                  {org.utm_source && <span> via {org.utm_source}</span>}
                                  {!org.lgpd_ai_consent && <span> sem onboarding</span>}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Score */}
                          <td className="px-4 py-3 text-right">
                            {current ? (
                              <span className="text-sm font-black" style={{ color: 'var(--admin-text-primary)' }}>{current.total}</span>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>-</span>
                            )}
                          </td>

                          {/* Faixa */}
                          <td className="px-4 py-3">
                            {faixa && current ? (
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                                style={{ background: faixa.bg, color: faixa.text }}
                              >
                                {FAIXA_LABEL[current.faixa] ?? current.faixa}
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>-</span>
                            )}
                          </td>

                          {/* Delta */}
                          <td className="px-4 py-3 text-right">
                            {delta !== null && delta !== 0 ? (
                              <span className="text-xs font-bold" style={{ color: delta > 0 ? 'var(--admin-success)' : 'var(--admin-error)' }}>
                                {delta > 0 ? '+' : ''}{delta}
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>-</span>
                            )}
                          </td>

                          {/* Ultimo score */}
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--admin-text-muted)' }}>
                            {lastScoreDate ? (
                              <span style={{ color: daysSinceScore !== null && daysSinceScore > 14 ? 'var(--admin-warning)' : 'var(--admin-text-muted)' }}>
                                {formatDate(lastScoreDate)}{daysSinceScore !== null && ` (${daysSinceScore}d)`}
                              </span>
                            ) : '-'}
                          </td>

                          {/* Acoes */}
                          <td className="px-4 py-3 text-center">
                            <RetriggerButton orgId={org.id} orgName={org.name} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Secao 6: Leads */}
          <section id="leads" className="rounded-2xl overflow-hidden" style={{ background: 'var(--admin-bg-card)', backgroundImage: 'var(--admin-gradient-card)', border: '1px solid var(--admin-border-card)', boxShadow: 'var(--admin-shadow-md)' }} aria-labelledby="leads-heading">
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
              <h2 id="leads-heading" className="font-semibold" style={{ color: 'var(--admin-text-heading)' }}>Ultimos leads ({leads.length})</h2>
            </div>
            {leads.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>Nenhum lead capturado ainda.</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] px-6 py-1 md:hidden" style={{ color: 'var(--admin-text-muted)' }}>Deslize para ver mais</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'rgba(35,83,71,0.5)' }}>
                        <th className="px-6 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Email</th>
                        <th className="px-4 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Negocio</th>
                        <th className="px-4 py-3 text-right" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Score</th>
                        <th className="px-4 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Fonte</th>
                        <th className="px-4 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => (
                        <tr
                          key={lead.id}
                          className="admin-row-hover" style={i > 0 ? { borderTop: "1px solid var(--admin-border-subtle)" } : undefined}
                          
                          
                        >
                          <td className="px-6 py-2.5 font-medium" style={{ color: 'var(--admin-text-primary)' }}>{lead.email}</td>
                          <td className="px-4 py-2.5 truncate max-w-[200px]" style={{ color: 'var(--admin-text-secondary)' }}>{lead.place_name ?? '-'}</td>
                          <td className="px-4 py-2.5 text-right">
                            {lead.score !== null ? (
                              <span className="font-bold" style={{ color: 'var(--admin-text-primary)' }}>{lead.score}</span>
                            ) : <span style={{ color: 'var(--admin-text-muted)' }}>-</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            {lead.utm_source ? (
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-md"
                                style={{ background: 'rgba(142,182,155,0.12)', color: 'var(--admin-accent-bright)', border: '1px solid rgba(142,182,155,0.2)' }}
                              >
                                {lead.utm_source}{lead.utm_medium ? `/${lead.utm_medium}` : ''}
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>organico</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--admin-text-muted)' }}>{formatDateFull(lead.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          {/* Secao 7: Alertas - tokens com problema */}
          {brokenTokens.length > 0 && (
            <section id="alerts" className="rounded-2xl overflow-hidden" style={{ background: 'var(--admin-bg-card)', border: '1px solid var(--admin-error-border)' }} aria-labelledby="alerts-heading">
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--admin-error-border)' }}>
                <h2 id="alerts-heading" className="font-semibold" style={{ color: 'var(--admin-error)' }}>Tokens com problema ({brokenTokens.length})</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>Clientes com entrega parada. Automacoes nao estao funcionando.</p>
              </div>
              <div>
                {brokenTokens.map((org, i) => {
                  const t = tokenByOrg[org.id]
                  return (
                    <div
                      key={org.id}
                      className="px-6 py-3 flex items-center justify-between admin-row-hover"
                      style={i > 0 ? { borderTop: '1px solid var(--admin-border-subtle)' } : undefined}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--admin-text-primary)' }}>{org.name}</p>
                        <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
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

        </main>
      </div>

      {/* Responsive grid styles */}
      <style>{`
        @media (max-width: 1279px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .charts-grid { grid-template-columns: 1fr 1fr !important; }
          .charts-grid > *:last-child { grid-column: 1 / -1; }
        }
        @media (max-width: 767px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .charts-grid { grid-template-columns: 1fr !important; }
          .charts-grid > *:last-child { grid-column: auto; }
          .movers-grid { grid-template-columns: 1fr !important; }
        }
        :focus-visible {
          outline: 2px solid var(--admin-accent);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}
