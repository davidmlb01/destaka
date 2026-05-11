'use client'

import type { CategoryScore } from '@/lib/gmb/scorer'
import { getScoreColor } from '@/lib/utils/score-colors'
import { Spinner } from '@/components/ui/Spinner'
import { PinIcon } from '@/components/ui/PinIcon'
import { ScoreGauge } from '@/components/dashboard/ScoreGauge'
import { useVerifyDiagnostic } from '@/components/dashboard/hooks/useVerifyDiagnostic'
import { useLeadCapture } from '@/components/dashboard/hooks/useLeadCapture'


function scoreColor(score: number) {
  if (score === 0) return 'rgba(255,255,255,0.3)'
  return getScoreColor(score)
}

function scoreLabel(total: number) {
  if (total >= 70) return 'Perfil bem otimizado'
  if (total >= 40) return 'Tem espaço para melhorar'
  return 'Precisa de atenção urgente'
}


export function VerifyTool() {
  const {
    input,
    setInput,
    loading,
    result,
    error,
    expandedCat,
    setExpandedCat,
    handleVerify,
  } = useVerifyDiagnostic()

  const {
    captureEmail,
    setCaptureEmail,
    lgpdConsent,
    setLgpdConsent,
    capturing,
    captureMsg,
    handleCapture,
  } = useLeadCapture(
    result
      ? { placeName: result.place.name, score: result.score.total, categories: result.score.categories }
      : null,
  )

  return (
    <div className="flex flex-col gap-6">

      {/* Input: sem card, protagonista */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            placeholder="Cole o link do Google Maps ou escreva o nome e cidade"
            className="flex-1 rounded-2xl px-5 py-4 text-sm"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'white',
              outline: 'none',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.5)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          />
          <button
            onClick={handleVerify}
            disabled={loading || !input.trim()}
            className="rounded-2xl px-7 py-4 text-sm font-bold transition-all shrink-0"
            style={{
              background: loading || !input.trim()
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, rgba(14,165,233,0.4), rgba(14,165,233,0.25))',
              border: `1px solid ${loading || !input.trim() ? 'rgba(255,255,255,0.08)' : 'rgba(14,165,233,0.45)'}`,
              color: loading || !input.trim() ? 'rgba(255,255,255,0.2)' : 'var(--accent-bright)',
              boxShadow: loading || !input.trim() ? 'none' : '0 0 24px rgba(14,165,233,0.15)',
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size="md" />
                Analisando...
              </span>
            ) : 'Analisar agora'}
          </button>
        </div>

        {error && (
          <p className="text-xs px-1" style={{ color: 'var(--error)' }}>{error}</p>
        )}

        <p className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Funciona com qualquer link do Google Maps: maps.google.com, maps.app.goo.gl ou goo.gl/maps
        </p>
      </div>

      {/* Resultado */}
      {result && (
        <div className="flex flex-col gap-5">

          {/* Aviso de demo, linguagem amigavel */}
          {result.usingMock && (
            <div
              className="rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs"
              style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.15)', color: 'rgba(14,165,233,0.7)' }}
            >
              <PinIcon size={12} />
              Dados demonstrativos para visualização do diagnóstico.
            </div>
          )}

          {/* Score (mobile: primeiro) + Info (mobile: segundo) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Score: order-first no mobile */}
            <div
              className="rounded-2xl p-5 flex flex-col items-center justify-center order-first lg:order-last"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ScoreGauge score={result.score.total} size={140} showGlow={false} />
              <p
                className="font-display font-bold text-sm text-center mt-1"
                style={{ color: scoreColor(result.score.total) }}
              >
                {scoreLabel(result.score.total)}
              </p>
            </div>

            {/* Perfil */}
            <div
              className="lg:col-span-2 rounded-2xl p-5 order-last lg:order-first"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2
                className="font-display font-extrabold text-white mb-0.5"
                style={{ fontSize: 20, lineHeight: 1.2 }}
              >
                {result.place.name}
              </h2>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                {result.place.address}
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <InfoRow
                  label="Telefone"
                  value={result.place.phone ?? 'Não cadastrado'}
                  missing={!result.place.phone}
                />
                <InfoRow
                  label="Website"
                  value={result.place.website ? 'Vinculado' : 'Não vinculado'}
                  missing={!result.place.website}
                />
                <InfoRow
                  label="Nota média"
                  value={result.place.rating ? `${result.place.rating.toFixed(1)} / 5.0` : 'Sem avaliações'}
                  missing={!result.place.rating}
                />
                <InfoRow
                  label="Avaliações"
                  value={result.place.reviewsTotal
                    ? `${result.place.reviewsTotal} ${result.place.reviewsTotal === 1 ? 'avaliação' : 'avaliações'}`
                    : 'Nenhuma ainda'}
                  missing={!result.place.reviewsTotal}
                />
              </div>
            </div>
          </div>

          {/* Categorias */}
          <div>
            <p
              className="font-display font-bold text-white text-sm mb-3"
              style={{ opacity: 0.6 }}
            >
              Detalhamento por categoria
            </p>
            <div className="flex flex-col gap-2">
              {result.score.categories.map(cat => (
                <CategoryRow
                  key={cat.name}
                  category={cat}
                  expanded={expandedCat === cat.name}
                  onToggle={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
                />
              ))}
            </div>
          </div>

          {/* CTA */}
          <div
            className="rounded-2xl px-6 py-6 flex flex-col sm:flex-row items-center gap-5"
            style={{
              background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(14,165,233,0.06))',
              border: '1px solid rgba(14,165,233,0.22)',
            }}
          >
            <div className="flex-1 text-center sm:text-left">
              <p className="font-display font-bold text-white mb-1" style={{ fontSize: 16 }}>
                A Destaka corrige isso automaticamente.
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Conecte seu perfil e veja as otimizações sendo aplicadas em minutos.
              </p>
            </div>
            <a
              href="/saude/login"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap"
              style={{
                background: 'rgba(14,165,233,0.3)',
                border: '1px solid rgba(14,165,233,0.45)',
                color: 'var(--accent-bright)',
                boxShadow: '0 0 20px rgba(14,165,233,0.2)',
              }}
            >
              Começar gratuitamente
              <span style={{ fontSize: 14 }}>→</span>
            </a>
          </div>

          {/* Captura de email */}
          {!captureMsg ? (
            <div
              className="rounded-2xl px-6 py-5"
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="font-display font-bold text-white mb-1" style={{ fontSize: 14 }}>
                Receba este relatório no seu email
              </p>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Sem cadastro. Só o relatório.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <input
                  type="email"
                  value={captureEmail}
                  onChange={e => setCaptureEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="flex-1 rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleCapture}
                  disabled={capturing || !captureEmail.includes('@') || !lgpdConsent}
                  className="shrink-0 rounded-xl px-6 py-3 text-sm font-bold"
                  style={{
                    background: capturing || !captureEmail.includes('@') || !lgpdConsent
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(15,17,23,0.7)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: capturing || !captureEmail.includes('@') || !lgpdConsent ? 'not-allowed' : 'pointer',
                  }}
                >
                  {capturing ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lgpdConsent}
                  onChange={e => setLgpdConsent(e.target.checked)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                  Concordo em receber o relatório e comunicações da Destaka. Seus dados são protegidos conforme a LGPD e não serão compartilhados.
                </span>
              </label>
            </div>
          ) : (
            <div
              className="rounded-2xl px-6 py-4 text-center"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{captureMsg}</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, missing }: {
  label: string
  value: string
  missing: boolean
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: missing ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${missing ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <p className="text-xs mb-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
        <PinIcon size={10} color={missing ? 'var(--error)' : 'var(--accent)'} />
        {label}
      </p>
      <p
        className="text-sm font-medium"
        style={{ color: missing ? 'var(--error)' : 'rgba(255,255,255,0.8)' }}
      >
        {value}
      </p>
    </div>
  )
}

function severityColor(severity: string) {
  if (severity === 'critical') return 'var(--error)'
  if (severity === 'warning') return 'var(--warning)'
  return 'var(--accent)'
}

function CategoryRow({ category, expanded, onToggle }: {
  category: CategoryScore
  expanded: boolean
  onToggle: () => void
}) {
  const perfect = category.issues.length === 0

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.2)',
        border: `1px solid ${perfect ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={!perfect ? onToggle : undefined}
        style={{ cursor: perfect ? 'default' : 'pointer' }}
      >
        <PinIcon size={14} color={perfect ? 'var(--success)' : 'var(--accent)'} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-white">{category.label}</span>
            <span className="text-sm font-bold ml-3 shrink-0" style={{ color: 'var(--accent)' }}>
              {category.score === 0 ? '0' : category.score}/{category.maxScore}
            </span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${category.percentage}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>

        {/* Indicador de estado */}
        <div className="shrink-0 ml-2" style={{ width: 20, textAlign: 'center' }}>
          {perfect ? (
            <span style={{ color: 'var(--success)', fontSize: 14 }}>&#10003;</span>
          ) : (
            <span
              className="text-xs block transition-transform duration-200"
              style={{
                color: 'var(--text-muted)',
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
            >
              &#9660;
            </span>
          )}
        </div>
      </button>

      {expanded && !perfect && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {category.issues.map((issue, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-2.5"
              style={{
                borderBottom: i < category.issues.length - 1
                  ? '1px solid rgba(255,255,255,0.04)'
                  : 'none',
              }}
            >
              <span
                className="inline-block rounded-full shrink-0"
                style={{
                  width: 8,
                  height: 8,
                  marginTop: 6,
                  background: severityColor(issue.severity),
                }}
              />
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {issue.message}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  impacto: +{issue.impact} pts se corrigido
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
