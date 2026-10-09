export const dynamic = 'force-dynamic'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { RetriggerButton } from './RetriggerButton'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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
  const db = admin()

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

  // Latest + previous score per org (para tendência)
  const scoresByOrg: Record<string, ScoreRow[]> = {}
  for (const s of (scores ?? []) as ScoreRow[]) {
    if (!scoresByOrg[s.organization_id]) scoresByOrg[s.organization_id] = []
    if (scoresByOrg[s.organization_id].length < 2) scoresByOrg[s.organization_id].push(s)
  }

  // Token status per org
  const tokenByOrg: Record<string, { hasToken: boolean; updatedAt: string | null }> = {}
  for (const t of (tokens ?? []) as TokenRow[]) {
    tokenByOrg[t.organization_id] = { hasToken: true, updatedAt: t.updated_at }
  }

  // Pending counts per org
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

const FAIXA_BADGE: Record<string, string> = {
  fraca: 'bg-red-50 text-red-600',
  funcional: 'bg-amber-50 text-amber-700',
  forte: 'bg-green-50 text-green-700',
  perfeita: 'bg-blue-50 text-blue-700',
}

const FAIXA_LABEL: Record<string, string> = {
  fraca: 'Fraca',
  funcional: 'Funcional',
  forte: 'Forte',
  perfeita: 'Perfeita',
}

const SUB_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-50', text: 'text-green-700', label: 'Pagante' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelado' },
  free: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Free' },
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
  return diff > 7 * 24 * 60 * 60 * 1000 // 7 dias sem atualização
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
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Destaka</p>
            <h1 className="text-base font-semibold text-slate-900">Painel Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            {brokenTokens.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {brokenTokens.length} token{brokenTokens.length > 1 ? 's' : ''} com problema
              </span>
            )}
            {totalPending > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {totalPending} pendentes
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ═══ STATS ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard value={`R$${mrr.toLocaleString('pt-BR')}`} label="MRR" accent />
          <StatCard value={payingOrgs.length} label="pagantes" />
          <StatCard value={freeOrgs.length} label="free" />
          <StatCard value={avgScore} label="score médio" />
          <StatCard value={brokenTokens.length} label="tokens quebrados" warn={brokenTokens.length > 0} />
        </div>

        {/* ═══ CLIENTES ═══ */}
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Clientes ({orgs.length})</h2>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600 font-semibold">{payingOrgs.length} pagantes</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">{freeOrgs.length} free</span>
              {cancelledOrgs.length > 0 && (
                <>
                  <span className="text-slate-400">|</span>
                  <span className="text-red-500">{cancelledOrgs.length} cancelados</span>
                </>
              )}
            </div>
          </div>

          {orgs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-400">Nenhum cliente cadastrado ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {orgs.map(org => {
                const scoreArr = scoresByOrg[org.id]
                const current = scoreArr?.[0]
                const previous = scoreArr?.[1]
                const delta = current && previous ? current.total - previous.total : null
                const pending = pendingByOrg[org.id] ?? 0
                const token = tokenByOrg[org.id]
                const tokenBroken = !token?.hasToken || isTokenStale(token.updatedAt)
                const subStatus = org.subscription_status ?? 'free'
                const sub = SUB_BADGE[subStatus] ?? SUB_BADGE.free

                return (
                  <div key={org.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{org.name}</p>
                        <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sub.bg} ${sub.text}`}>
                          {sub.label}
                        </span>
                        {tokenBroken && (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                            Token
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {org.specialty}
                        {org.utm_source ? ` · via ${org.utm_source}` : ''}
                        {' · '}{formatDate(org.created_at)}
                        {!org.lgpd_ai_consent ? ' · sem onboarding' : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {pending > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {pending}
                        </span>
                      )}
                      {current ? (
                        <div className="text-right flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-900">{current.total}</span>
                          {delta !== null && delta !== 0 && (
                            <span className={`text-xs font-bold ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${FAIXA_BADGE[current.faixa] ?? 'bg-slate-100 text-slate-400'}`}>
                            {FAIXA_LABEL[current.faixa] ?? current.faixa}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">sem score</span>
                      )}
                      <RetriggerButton orgId={org.id} orgName={org.name} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ═══ TOKENS COM PROBLEMA ═══ */}
        {brokenTokens.length > 0 && (
          <section className="bg-white rounded-2xl border border-red-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-50">
              <h2 className="font-semibold text-red-700">Tokens com problema ({brokenTokens.length})</h2>
              <p className="text-xs text-red-400 mt-0.5">Clientes com entrega parada. Automações não estão funcionando.</p>
            </div>
            <div className="divide-y divide-red-50">
              {brokenTokens.map(org => {
                const t = tokenByOrg[org.id]
                return (
                  <div key={org.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-400">
                        {!t?.hasToken ? 'Sem token Google' : `Última atualização: ${t.updatedAt ? formatDateFull(t.updatedAt) : 'nunca'}`}
                      </p>
                    </div>
                    <RetriggerButton orgId={org.id} orgName={org.name} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ═══ ÚLTIMOS LEADS ═══ */}
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Últimos leads ({leads.length})</h2>
          </div>
          {leads.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-400">Nenhum lead capturado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-6 py-2.5 text-xs font-semibold text-slate-500">Email</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Negócio</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Score</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Fonte</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leads.map(lead => (
                    <tr key={lead.id}>
                      <td className="px-6 py-2.5 text-slate-900 font-medium">{lead.email}</td>
                      <td className="px-4 py-2.5 text-slate-600 truncate max-w-[200px]">{lead.place_name ?? '-'}</td>
                      <td className="px-4 py-2.5">
                        {lead.score !== null ? (
                          <span className="font-bold text-slate-900">{lead.score}</span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2.5">
                        {lead.utm_source ? (
                          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                            {lead.utm_source}{lead.utm_medium ? `/${lead.utm_medium}` : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">orgânico</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">{formatDateFull(lead.created_at)}</td>
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

function StatCard({ value, label, accent, warn }: { value: string | number; label: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
      <p className={`text-2xl font-black ${warn ? 'text-red-600' : accent ? 'text-green-700' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}
