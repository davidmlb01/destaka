'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface KeywordData {
  total_searches: number
  trend_pct: number | null
  top_keywords: Array<{
    keyword: string
    impressions: number
    clicks: number
    is_new: boolean
  }>
  other_count: number
  opportunity: { keyword: string; source: string } | null
  week_start: string
  empty?: boolean
  message?: string
}

export default function KeywordInsightCard({ isSubscriber }: { isSubscriber: boolean }) {
  const [data, setData] = useState<KeywordData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSubscriber) {
      setLoading(false)
      return
    }
    fetch('/api/dashboard/keywords')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((d: KeywordData) => {
        if (d && !('paywall' in d)) setData(d)
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [isSubscriber])

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-base font-semibold text-zinc-100 mb-1">Como te encontram</h3>
        <p className="text-sm text-zinc-500">Carregando...</p>
      </div>
    )
  }

  if (!data || data.empty) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-base font-semibold text-zinc-100 mb-1">Como te encontram</h3>
        <p className="text-sm text-zinc-400 mb-3">Buscas que trouxeram clientes essa semana</p>
        <p className="text-sm text-zinc-500">{data?.message ?? 'Coletando dados da primeira semana...'}</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-5">
      <h3 className="text-base font-semibold text-zinc-100 mb-1">Como te encontram</h3>
      <p className="text-sm text-zinc-400 mb-4">Buscas que trouxeram clientes essa semana</p>

      {/* Numero destaque */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold text-zinc-100">{data.total_searches}</span>
        <span className="text-sm text-zinc-400">pessoas buscaram e encontraram voce</span>
        {data.trend_pct !== null && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            data.trend_pct > 0
              ? 'text-emerald-400 bg-emerald-400/10'
              : data.trend_pct < 0
                ? 'text-red-400 bg-red-400/10'
                : 'text-yellow-400 bg-yellow-400/10'
          }`}>
            {data.trend_pct > 0 ? '↑' : data.trend_pct < 0 ? '↓' : '='} {Math.abs(data.trend_pct)}%
          </span>
        )}
      </div>

      {/* Lista de keywords */}
      <div className="relative">
        <div className={`space-y-2 ${!isSubscriber ? 'blur-sm pointer-events-none' : ''}`}>
          {data.top_keywords.map((kw, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-zinc-300 truncate">&quot;{kw.keyword}&quot;</span>
                {kw.is_new && (
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 shrink-0">
                    novo
                  </span>
                )}
              </div>
              <span className="text-zinc-500 tabular-nums shrink-0 ml-2">{kw.impressions} buscas</span>
            </div>
          ))}
          {data.other_count > 0 && (
            <p className="text-xs text-zinc-500">+ {data.other_count} outras buscas</p>
          )}
        </div>

        {!isSubscriber && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <svg className="w-6 h-6 text-zinc-400 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-zinc-300 text-xs font-medium mb-1.5">Assine para ver quais buscas trazem seus clientes</p>
            <Link
              href="/dashboard/upgrade"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Ver minhas buscas
            </Link>
          </div>
        )}
      </div>

      {/* Oportunidade competitiva */}
      {isSubscriber && data.opportunity && (
        <div className="mt-4 p-3 bg-amber-400/5 border border-amber-400/20 rounded-lg">
          <p className="text-sm text-amber-300">
            Seus concorrentes aparecem para <span className="font-semibold">&quot;{data.opportunity.keyword}&quot;</span> e voce ainda nao. Destaka esta otimizando seu perfil para essa busca.
          </p>
        </div>
      )}
    </div>
  )
}
