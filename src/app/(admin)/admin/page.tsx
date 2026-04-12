import { createClient as createAdminClient } from '@supabase/supabase-js'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAdminData() {
  const db = admin()

  const [
    { data: orgs },
    { data: scores },
    { data: pendingResponses },
    { data: pendingPosts },
  ] = await Promise.all([
    db.from('organizations').select('id, name, specialty, created_at'),
    db.from('scores').select('organization_id, total, faixa, snapshot_date').order('snapshot_date', { ascending: false }),
    db.from('review_responses').select('organization_id').eq('status', 'pending'),
    db.from('posts').select('organization_id').eq('status', 'pending'),
  ])

  // Latest score per org
  const latestScoreByOrg: Record<string, { total: number; faixa: string }> = {}
  for (const s of scores ?? []) {
    if (!latestScoreByOrg[s.organization_id]) {
      latestScoreByOrg[s.organization_id] = { total: s.total, faixa: s.faixa }
    }
  }

  // Pending counts per org
  const pendingByOrg: Record<string, number> = {}
  for (const r of pendingResponses ?? []) {
    pendingByOrg[r.organization_id] = (pendingByOrg[r.organization_id] ?? 0) + 1
  }
  for (const p of pendingPosts ?? []) {
    pendingByOrg[p.organization_id] = (pendingByOrg[p.organization_id] ?? 0) + 1
  }

  return { orgs: orgs ?? [], latestScoreByOrg, pendingByOrg }
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function AdminPage() {
  const { orgs, latestScoreByOrg, pendingByOrg } = await getAdminData()

  const totalPending = Object.values(pendingByOrg).reduce((a, b) => a + b, 0)

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Destaka</p>
            <h1 className="text-base font-semibold text-slate-900">Admin</h1>
          </div>
          {totalPending > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {totalPending} pendentes
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 px-6 py-5">
            <p className="text-3xl font-black text-slate-900">{orgs.length}</p>
            <p className="text-xs text-slate-400 mt-1">clientes ativos</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 px-6 py-5">
            <p className="text-3xl font-black text-slate-900">
              {orgs.length > 0
                ? Math.round(
                    Object.values(latestScoreByOrg).reduce((s, v) => s + v.total, 0) /
                    Math.max(Object.values(latestScoreByOrg).length, 1)
                  )
                : 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">score médio</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 px-6 py-5">
            <p className="text-3xl font-black text-amber-600">{totalPending}</p>
            <p className="text-xs text-slate-400 mt-1">ações pendentes</p>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Clientes</h2>
          </div>

          {orgs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-400">Nenhum cliente cadastrado ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {orgs.map(org => {
                const score = latestScoreByOrg[org.id]
                const pending = pendingByOrg[org.id] ?? 0
                return (
                  <div key={org.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-400">{org.specialty} &bull; desde {formatDate(org.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {pending > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {pending} pend.
                        </span>
                      )}
                      {score ? (
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900">{score.total}</span>
                          <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${FAIXA_BADGE[score.faixa] ?? 'bg-slate-100 text-slate-400'}`}>
                            {FAIXA_LABEL[score.faixa] ?? score.faixa}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">sem score</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
