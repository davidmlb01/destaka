'use client'

import { useState } from 'react'
import type { CategoryScore } from '@/lib/gmb/scorer'

interface PlaceInfo {
  name: string
  address: string
  phone: string | null
  website: string | null
  rating: number | null
  reviewsTotal: number | null
  types: string[]
}

interface VerifyResult {
  place: PlaceInfo
  score: { total: number; categories: CategoryScore[] }
  usingMock: boolean
}

const CATEGORY_ICONS: Record<string, string> = {
  info: '📋',
  photos: '📸',
  reviews: '⭐',
  posts: '📝',
  services: '🏥',
  attributes: '✅',
}

function scoreColor(score: number) {
  if (score === 0) return 'rgba(255,255,255,0.3)'
  if (score >= 70) return '#4ADE80'
  if (score >= 40) return '#FBBF24'
  return 'var(--error)'
}

function scoreLabel(total: number) {
  if (total >= 70) return 'Perfil bem otimizado'
  if (total >= 40) return 'Tem espaço para melhorar'
  return 'Precisa de atenção urgente'
}

function ScoreArc({ score }: { score: number }) {
  const R = 54, CX = 70, CY = 72, START = 225, TOTAL = 270

  function toRad(deg: number) { return ((deg - 90) * Math.PI) / 180 }
  function pt(deg: number) { return { x: CX + R * Math.cos(toRad(deg)), y: CY + R * Math.sin(toRad(deg)) } }
  function arc(from: number, sweep: number) {
    if (sweep <= 0) return ''
    const to = from + sweep
    const s = pt(from), e = pt(to)
    const large = sweep > 180 ? 1 : 0
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
  }

  const fill = (score / 100) * TOTAL
  const color = scoreColor(score)

  return (
    <svg width="140" height="130" viewBox="0 0 140 130">
      <path d={arc(START, TOTAL)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" strokeLinecap="round" />
      {fill > 0 && <path d={arc(START, fill)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />}
      <text x={CX} y={CY + 7} textAnchor="middle" fill="white" fontSize="30" fontWeight="800">{score}</text>
      <text x={CX} y={CY + 23} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">de 100</text>
    </svg>
  )
}

export function VerifyTool() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState('')
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [captureEmail, setCaptureEmail] = useState('')
  const [lgpdConsent, setLgpdConsent] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [captureMsg, setCaptureMsg] = useState('')

  async function handleCapture() {
    if (!captureEmail.includes('@') || !lgpdConsent || !result) return
    setCapturing(true)
    setCaptureMsg('')
    const res = await fetch('/api/public/capture-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: captureEmail,
        placeName: result.place.name,
        score: result.score.total,
        categories: result.score.categories,
        lgpdConsent: true,
      }),
    })
    const data = await res.json() as { ok?: boolean; emailSent?: boolean; error?: string }
    if (data.ok) {
      setCaptureMsg(data.emailSent ? 'Relatorio enviado! Confira sua caixa de entrada.' : 'Email registrado com sucesso.')
    } else {
      setCaptureMsg(data.error ?? 'Erro ao enviar. Tente novamente.')
    }
    setCapturing(false)
  }

  async function handleVerify() {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/public/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: input.trim() }),
    })

    if (!res.ok) {
      const data = await res.json() as { error?: string }
      setError(data.error ?? 'Não foi possível analisar este estabelecimento.')
      setLoading(false)
      return
    }

    setResult(await res.json() as VerifyResult)
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Input — sem card, protagonista */}
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
                <span
                  className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(252,211,77,0.3)', borderTopColor: 'var(--accent-bright)' }}
                />
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

          {/* Aviso de demo — linguagem amigável */}
          {result.usingMock && (
            <div
              className="rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs"
              style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)', color: 'rgba(252,211,77,0.7)' }}
            >
              <span>🔬</span>
              Dados demonstrativos para visualização do diagnóstico.
            </div>
          )}

          {/* Score (mobile: primeiro) + Info (mobile: segundo) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Score — order-first no mobile */}
            <div
              className="rounded-2xl p-5 flex flex-col items-center justify-center order-first lg:order-last"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ScoreArc score={result.score.total} />
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
                  icon="📞"
                  label="Telefone"
                  value={result.place.phone ?? 'Não cadastrado'}
                  missing={!result.place.phone}
                />
                <InfoRow
                  icon="🌐"
                  label="Website"
                  value={result.place.website ? 'Vinculado' : 'Não vinculado'}
                  missing={!result.place.website}
                />
                <InfoRow
                  icon="⭐"
                  label="Nota média"
                  value={result.place.rating ? `${result.place.rating.toFixed(1)} / 5.0` : 'Sem avaliações'}
                  missing={!result.place.rating}
                />
                <InfoRow
                  icon="💬"
                  label="Avaliações"
                  value={result.place.reviewsTotal
                    ? `${result.place.reviewsTotal} avaliação${result.place.reviewsTotal !== 1 ? 'ões' : ''}`
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
              href="/login"
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
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}
            >
              <p className="text-sm font-medium" style={{ color: '#34D399' }}>{captureMsg}</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value, missing }: {
  icon: string
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
      <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {icon} {label}
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

function CategoryRow({ category, expanded, onToggle }: {
  category: CategoryScore
  expanded: boolean
  onToggle: () => void
}) {
  const color = scoreColor(category.percentage)
  const perfect = category.issues.length === 0

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.2)',
        border: `1px solid ${perfect ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={!perfect ? onToggle : undefined}
        style={{ cursor: perfect ? 'default' : 'pointer' }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>{CATEGORY_ICONS[category.name] ?? '📊'}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-white">{category.label}</span>
            <span className="text-sm font-bold ml-3 shrink-0" style={{ color }}>
              {category.score === 0 ? '–' : category.score}/{category.maxScore}
            </span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${category.percentage}%`, background: color }}
            />
          </div>
        </div>

        {/* Indicador de estado */}
        <div className="shrink-0 ml-2" style={{ width: 20, textAlign: 'center' }}>
          {perfect ? (
            <span style={{ color: '#4ADE80', fontSize: 14 }}>✓</span>
          ) : (
            <span
              className="text-xs block transition-transform duration-200"
              style={{
                color: 'rgba(255,255,255,0.3)',
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
            >
              ▼
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
              <span style={{ fontSize: 12, marginTop: 2, flexShrink: 0 }}>
                {issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵'}
              </span>
              <div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
                  {issue.message}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
