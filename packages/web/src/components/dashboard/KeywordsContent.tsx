'use client'

import { Spinner } from '@/components/ui/Spinner'
import { Pulse } from './Skeletons'
import { useKeywords } from './hooks/useKeywords'

type Tab = 'searches' | 'suggestions'

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function KeywordsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <Pulse style={{ width: `${140 + i * 20}px`, height: 14 }} />
            <Pulse style={{ width: 60, height: 14 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Trend indicator
// ---------------------------------------------------------------------------

function TrendBadge({ trend, percent }: { trend: 'up' | 'down' | 'stable'; percent: number }) {
  const config = {
    up: { icon: '↑', color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
    down: { icon: '↓', color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
    stable: { icon: '→', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' },
  }[trend]

  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1"
      style={{ background: config.bg, color: config.color }}
    >
      {config.icon} {Math.abs(percent)}%
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function KeywordsContent() {
  const {
    tab,
    setTab,
    keywords,
    suggestions,
    loading,
    error,
    suggestionsLoading,
    suggestionsError,
  } = useKeywords()

  // ---- Error state ----
  if (error && tab === 'searches') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[15px] mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-[14px] font-medium px-4 py-2 rounded-lg"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'searches' as Tab, label: 'Suas buscas' },
          { key: 'suggestions' as Tab, label: 'Sugestões' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: tab === t.key ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.06)',
              color: tab === t.key ? 'var(--accent-bright)' : 'rgba(255,255,255,0.5)',
              border: tab === t.key ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
            }}
          >
            {t.label}
            {t.key === 'suggestions' && suggestions.length > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--accent-hover)', color: 'white', fontSize: 10 }}
              >
                {suggestions.filter(s => s.autocomplete).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Suas buscas */}
      {tab === 'searches' && (
        loading ? (
          <KeywordsSkeleton />
        ) : keywords.length === 0 ? (
          <div
            className="rounded-2xl flex items-center justify-center py-16"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Nenhuma keyword encontrada para seu perfil.
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                O Google pode levar alguns dias para disponibilizar dados de busca.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary card */}
            <div
              className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}
            >
              <span style={{ fontSize: 18 }}>🔍</span>
              <p className="text-sm font-medium" style={{ color: 'var(--accent-bright)' }}>
                {keywords.length} {keywords.length === 1 ? 'keyword encontrada' : 'keywords encontradas'} nos últimos 3 meses
              </p>
            </div>

            {/* Table header */}
            <div
              className="grid gap-4 px-5 py-2.5 mb-2 text-xs font-semibold uppercase tracking-wider"
              style={{ gridTemplateColumns: '1fr 100px 100px', color: 'rgba(255,255,255,0.3)' }}
            >
              <span>Keyword</span>
              <span className="text-right">Impressões</span>
              <span className="text-right">Tendência</span>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-1.5">
              {keywords.map((kw, i) => (
                <div
                  key={`${kw.keyword}-${i}`}
                  className="grid gap-4 items-center rounded-xl px-5 py-3 transition-colors"
                  style={{
                    gridTemplateColumns: '1fr 100px 100px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-sm text-white truncate" title={kw.keyword}>
                    {kw.keyword}
                  </span>
                  <span className="text-sm text-right font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {kw.impressions.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-right">
                    <TrendBadge trend={kw.trend} percent={kw.trendPercent} />
                  </span>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* Tab: Sugestões */}
      {tab === 'suggestions' && (
        suggestionsLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="lg" />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Gerando sugestões com IA e validando no Google...
            </p>
          </div>
        ) : suggestionsError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{suggestionsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[14px] font-medium px-4 py-2 rounded-lg"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {/* Info card */}
            <div
              className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
            >
              <span style={{ fontSize: 18 }}>✨</span>
              <p className="text-sm" style={{ color: 'rgba(168,85,247,0.9)' }}>
                Keywords geradas por IA com base na sua especialidade. As verificadas aparecem nas sugestões do Google.
              </p>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <div
                  key={`${s.keyword}-${i}`}
                  className="flex items-center justify-between rounded-xl px-5 py-3"
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: `1px solid ${s.autocomplete ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <span className="text-sm text-white">{s.keyword}</span>
                  {s.autocomplete && (
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80' }}
                    >
                      ✓ Verificada
                    </span>
                  )}
                </div>
              ))}
            </div>

            {suggestions.length > 0 && (
              <p className="text-xs mt-4 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {suggestions.filter(s => s.autocomplete).length} de {suggestions.length} keywords aparecem nas sugestões do Google
              </p>
            )}
          </>
        )
      )}
    </>
  )
}
