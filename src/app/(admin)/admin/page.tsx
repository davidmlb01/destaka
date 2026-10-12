export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { RetriggerButton } from './RetriggerButton'

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
  ] = await Promise.all([
    db.from('organizations').select('id, name, specialty, subscription_status, lgpd_ai_consent, created_at, utm_source'),
    db.from('scores').select('organization_id, total, faixa, snapshot_date').order('snapshot_date', { ascending: false }),
    db.from('review_responses').select('organization_id').eq('status', 'pending'),
    db.from('posts').select('organization_id').eq('status', 'pending'),
    db.from('google_tokens').select('organization_id, updated_at'),
    db.from('leads').select('id, email, place_name, score, utm_source, utm_medium, utm_campaign, created_at').order('created_at', { ascending: false }).limit(20),
  ])

  const scoresByOrg: Record<string, ScoreRow[]> = {}
  for (const s of (scores ?? []) as ScoreRow[]) {
    if (!scoresByOrg[s.organization_id]) scoresByOrg[s.organization_id] = []
    if (scoresByOrg[s.organization_id].length < 2) scoresByOrg[s.organization_id].push(s)
  }

  const tokenByOrg: Record<string, { hasToken: boolean; updatedAt: string | null }> = {}
  for (const t of (tokens ?? []) as TokenRow[]) {
    tokenByOrg[t.organization_id] = { hasToken: true, updatedAt: t.updated_at }
  }

  const pendingByOrg: Record<string, number> = {}
  for (const r of pendingResponses ?? []) {
    pendingByOrg[(r as { organization_id: string }).organization_id] = (pendingByOrg[(r as { organization_id: string }).organization_id] ?? 0) + 1
  }
  for (const p of pendingPosts ?? []) {
    pendingByOrg[(p as { organization_id: string }).organization_id] = (pendingByOrg[(p as { organization_id: string }).organization_id] ?? 0) + 1
  }

  return {
    orgs: (orgs ?? []) as OrgRow[],
    scoresByOrg,
    pendingByOrg,
    tokenByOrg,
    leads: (leads ?? []) as LeadRow[],
  }
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

export default async function AdminPage() {
  const { orgs, scoresByOrg, pendingByOrg, tokenByOrg, leads } = await getAdminData()

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

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Destaka</p>
            <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Painel Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            {brokenTokens.length > 0 && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error-border)' }}
              >
                {brokenTokens.length} token{brokenTokens.length > 1 ? 's' : ''} com problema
              </span>
            )}
            {totalPending > 0 && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}
              >
                {totalPending} pendentes
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard value={`R$${mrr.toLocaleString('pt-BR')}`} label="MRR" color="var(--accent)" />
          <StatCard value={payingOrgs.length} label="pagantes" color="var(--success)" />
          <StatCard value={freeOrgs.length} label="free" />
          <StatCard value={avgScore} label="score medio" />
          <StatCard value={brokenTokens.length} label="tokens quebrados" color={brokenTokens.length > 0 ? 'var(--error)' : undefined} />
        </div>

        {/* Clientes */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
        >
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Clientes ({orgs.length})</h2>
            <div className="flex gap-2 text-xs">
              <span style={{ color: 'var(--success)' }} className="font-semibold">{payingOrgs.length} pagantes</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: 'var(--text-tertiary)' }}>{freeOrgs.length} free</span>
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

                return (
                  <div
                    key={org.id}
                    className="px-6 py-4 flex items-center justify-between gap-4"
                    style={i > 0 ? { borderTop: '1px solid var(--border-subtle)' } : undefined}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{org.name}</p>
                        <span
                          className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: sub.bg, color: sub.text, border: `1px solid ${sub.border}` }}
                        >
                          {sub.label}
                        </span>
                        {tokenBroken && (
                          <span
                            className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error-border)' }}
                          >
                            Token
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {org.specialty}
                        {org.utm_source ? ` · via ${org.utm_source}` : ''}
                        {' · '}{formatDate(org.created_at)}
                        {!org.lgpd_ai_consent ? ' · sem onboarding' : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {pending > 0 && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}
                        >
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
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ background: faixa!.bg, color: faixa!.text }}
                          >
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

        {/* Tokens com problema */}
        {brokenTokens.length > 0 && (
          <section
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--card-subtle)', border: '1px solid var(--error-border)' }}
          >
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--error-border)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--error)' }}>Tokens com problema ({brokenTokens.length})</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Clientes com entrega parada. Automacoes nao estao funcionando.</p>
            </div>
            <div>
              {brokenTokens.map((org, i) => {
                const t = tokenByOrg[org.id]
                return (
                  <div
                    key={org.id}
                    className="px-6 py-3 flex items-center justify-between"
                    style={i > 0 ? { borderTop: '1px solid var(--border-subtle)' } : undefined}
                  >
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

        {/* Ultimos leads */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
        >
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Ultimos leads ({leads.length})</h2>
          </div>
          {leads.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum lead capturado ainda.</p>
            </div>
          ) : (
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
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-md"
                            style={{ background: 'var(--accent-bg)', color: 'var(--accent-bright)', border: '1px solid var(--accent-border)' }}
                          >
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
          )}
        </section>

      </div>
    </main>
  )
}

function StatCard({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <p className="text-2xl font-black" style={{ color: color ?? 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}
