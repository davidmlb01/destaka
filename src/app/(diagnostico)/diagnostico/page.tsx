'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useDiagnostico } from '@/components/diagnostico/useDiagnostico'
import CompetitorsSection from '@/components/diagnostico/CompetitorsSection'
import ReviewsSection from '@/components/diagnostico/ReviewsSection'
import OfferSection from '@/components/diagnostico/OfferSection'
import StickyCTA from '@/components/diagnostico/StickyCTA'
import ShareButton from '@/components/diagnostico/ShareButton'
import { Logo } from '@/components/ui/Logo'
import type { DiagGap } from '@/components/diagnostico/useDiagnostico'
import { trackBeginCheckout } from '@/lib/tracking/events'

const DiagMapContent = dynamic(() => import('@/components/diagnostico/DiagMapContent'), { ssr: false })

/* ── Helpers ── */

function useCountUp(target: number, duration = 1200) {
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [value, setValue] = useState(reducedMotion ? target : 0)
  const started = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reducedMotion || target === 0) { setValue(target); return }
    if (started.current) { setValue(target); return }
    started.current = true

    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration, reducedMotion])

  return { value, ref }
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--success)'
  if (score >= 40) return 'var(--warning)'
  return 'var(--error)'
}

function categorizeGap(gap: DiagGap): 'rapido' | 'estrategico' | 'continuo' {
  const rapido = ['description', 'categories', 'attributes', 'services', 'hours', 'website']
  const estrategico = ['photos', 'posts', 'review_response']
  if (rapido.includes(gap.field)) return 'rapido'
  if (estrategico.includes(gap.field)) return 'estrategico'
  return 'continuo'
}

function getCtaText(score: number): string {
  if (score < 30) return 'Corrigir meu perfil agora'
  if (score < 50) return 'Quero mais clientes'
  if (score <= 70) return 'Liderar minha região'
  return 'Manter minha liderança'
}

function estimateLostClients(score: number): number {
  if (score >= 80) return 1
  if (score >= 60) return 2
  if (score >= 40) return 4
  if (score >= 20) return 6
  return 8
}

function getVerticalLabel(categoria: string): string | undefined {
  const lower = (categoria || '').toLowerCase()
  if (lower.includes('saúde') || lower.includes('saude') || lower.includes('médic') || lower.includes('medic') || lower.includes('dentist') || lower.includes('fisio') || lower.includes('psicol') || lower.includes('nutrici')) return 'Saúde'
  if (lower.includes('pet') || lower.includes('veterinár') || lower.includes('veterinar')) return 'Pet'
  if (lower.includes('advogad') || lower.includes('jurídi') || lower.includes('juridi')) return 'Jurídico'
  if (lower.includes('contab') || lower.includes('contábil')) return 'Contábil'
  if (lower.includes('imobiliár') || lower.includes('imobiliar')) return 'Imóveis'
  return undefined
}

function getTagline(categoria: string): { title: string; subtitle: string } {
  const lower = (categoria || '').toLowerCase()
  if (lower.includes('saúde') || lower.includes('saude') || lower.includes('médic') || lower.includes('medic') || lower.includes('dentist') || lower.includes('fisio') || lower.includes('psicol') || lower.includes('nutrici')) {
    return { title: 'Você cuida de atender seus pacientes.', subtitle: 'Nós cuidamos de fazer novos pacientes chegar até você.' }
  }
  if (lower.includes('pet') || lower.includes('veterinár') || lower.includes('veterinar')) {
    return { title: 'Você cuida dos pets.', subtitle: 'Nós cuidamos de trazer novos tutores até você.' }
  }
  if (lower.includes('advogad') || lower.includes('jurídi') || lower.includes('juridi')) {
    return { title: 'Você cuida dos seus clientes.', subtitle: 'Nós cuidamos de trazer novos clientes até você.' }
  }
  return { title: 'Você cuida do seu negócio.', subtitle: 'Nós cuidamos de trazer novos clientes até você.' }
}

/* ── Page ── */

export default function DiagnosticoPage() {
  const { data, isLoading, error } = useDiagnostico()
  const [shareHash, setShareHash] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/diagnostico/share')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.hash) setShareHash(d.hash) })
      .catch(() => {})
  }, [])

  // Loading inicial (sem nenhum dado ainda)
  if (isLoading || error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
          <p className="font-display font-bold" style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>Analisando seu perfil</p>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Isso leva alguns segundos.</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  // Dados chegaram (mesmo que parciais), renderiza a pagina inteira
  const nome = data.perfil?.nome || 'Seu negócio'
  const endereco = data.perfil?.endereco || ''
  const categoria = data.perfil?.categoria || ''
  const gaps = data.gaps ?? []
  const hasScore = !!data.score && (data.score.atual > 0 || gaps.length > 0)
  const score = data.score?.atual ?? 0
  const scoreColor = hasScore ? getScoreColor(score) : 'var(--text-muted)'
  const lostClients = hasScore ? estimateLostClients(score) : 0
  const vertical = getVerticalLabel(categoria)
  const tagline = getTagline(categoria)
  const userRating = data.reviews?.ultima?.nota ?? 0
  const userReviewCount = (data.reviews?.sem_resposta_count ?? 0) + (data.reviews?.ultima ? 1 : 0)

  const rapidos = gaps.filter(g => categorizeGap(g) === 'rapido')
  const estrategicos = gaps.filter(g => categorizeGap(g) === 'estrategico')
  const continuos = gaps.filter(g => categorizeGap(g) === 'continuo')
  const rapidoImpact = rapidos.reduce((s, g) => s + g.impact, 0)
  const estrategicoImpact = estrategicos.reduce((s, g) => s + g.impact, 0)

  const mapa = data.mapa
  const weakCount = mapa?.zonas.filter(z => z.status === 'weak').length ?? 0
  const totalZones = mapa?.zonas.length ?? 0
  const radiusKm = mapa?.radius_km ?? 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse-ring { 0% { opacity: 0.4 } 50% { opacity: 1 } 100% { opacity: 0.4 } }`}</style>

      {/* Header */}
      <header className="sticky top-0" style={{ zIndex: 40, background: 'rgba(7,26,25,0.95)', backdropFilter: 'blur(12px)', height: 56 }}>
        <div className="max-w-[900px] mx-auto px-6 h-full flex items-center justify-between">
          <Logo size="md" href="https://destaka.com.br" vertical={vertical} />
          {shareHash && <ShareButton hash={shareHash} />}
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 pb-28">

        {/* BLOCO 1: Hero */}
        <section style={{ paddingTop: 32, paddingBottom: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Diagnóstico de visibilidade
            </p>
            <h1 className="font-display font-bold" style={{ fontSize: 24, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px' }}>
              {nome}
            </h1>
            {endereco && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>{endereco}</p>}
          </div>

          <style>{`@media (max-width: 640px) { .hero-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div className="hero-grid grid gap-6" style={{ gridTemplateColumns: mapa ? '1fr 1.85fr' : '1fr' }}>

            {/* Score Card (progressivo) */}
            <ScoreCard score={score} scoreColor={scoreColor} loading={!hasScore} />

            {/* Mapa (progressivo) */}
            {mapa ? (
              <MapCard mapa={mapa} radiusKm={radiusKm} totalZones={totalZones} weakCount={weakCount} />
            ) : (
              <div style={{ padding: '24px', borderRadius: 16, background: 'var(--card-subtle)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Mapeando seu alcance...</p>
              </div>
            )}
          </div>
        </section>

        {/* BLOCO 2: Quick Wins + Impacto + CTA (só aparece com score) */}
        {hasScore && (
          <section style={{ paddingBottom: 48, textAlign: 'center' }}>
            {/* Quick wins */}
            <div className="flex flex-col gap-3 text-left" style={{ maxWidth: 560, margin: '0 auto 28px' }}>
              {rapidos.length > 0 && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
                    {rapidos.length} {rapidos.length === 1 ? 'ajuste rápido' : 'ajustes rápidos'} = <span className="font-mono">+{rapidoImpact} pontos</span> em 7 dias
                  </p>
                </div>
              )}
              {estrategicos.length > 0 && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)' }}>
                    {estrategicos.length} {estrategicos.length === 1 ? 'ajuste estratégico' : 'ajustes estratégicos'} = <span className="font-mono">+{estrategicoImpact} pontos</span> em 30 dias
                  </p>
                </div>
              )}
              {continuos.length > 0 && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-bright)' }}>
                    {continuos.length} {continuos.length === 1 ? 'melhoria contínua' : 'melhorias contínuas'} para manter primeiras posições
                  </p>
                </div>
              )}
            </div>

            <h2 className="font-display font-bold" style={{ fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 6 }}>
              Você está perdendo até {lostClients} clientes por semana.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 12 }}>
              O Destaka ajuda você a conquistar esses clientes.
            </p>

            <button
              onClick={() => {
                trackBeginCheckout()
                fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
                  .then(r => r.json())
                  .then(d => { if (d.url) window.location.href = d.url })
                  .catch(() => {})
              }}
              className="inline-block font-semibold cursor-pointer"
              style={{ padding: '16px 48px', borderRadius: 14, background: 'var(--accent)', color: '#fff', fontSize: 16, border: 'none', boxShadow: '0 4px 24px rgba(20,184,166,0.3)', transition: 'transform 150ms, box-shadow 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(20,184,166,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(20,184,166,0.3)' }}
            >
              {getCtaText(score)}
            </button>
          </section>
        )}

        {/* BLOCO 3: Concorrentes */}
        {(data.concorrentes ?? []).length > 0 && (
          <div style={{ paddingBottom: 48 }}>
            <CompetitorsSection concorrentes={data.concorrentes ?? []} userRating={userRating} userReviewCount={userReviewCount} userName={nome} />
          </div>
        )}

        {/* BLOCO 4: Avaliações */}
        <div style={{ paddingBottom: 48 }}>
          <ReviewsSection unansweredCount={data.reviews?.sem_resposta_count ?? 0} lastReviewDate={data.reviews?.ultima?.data ?? null} />
        </div>

        {/* Tagline */}
        {hasScore && (
          <section className="text-center" style={{ paddingBottom: 48 }}>
            <h2 className="font-display font-bold" style={{ fontSize: 26, color: 'var(--text-primary)', lineHeight: 1.35, maxWidth: 560, margin: '0 auto 12px', letterSpacing: '-0.3px' }}>
              {tagline.title}
            </h2>
            <p style={{ fontSize: 18, color: 'var(--accent-bright)', lineHeight: 1.5, maxWidth: 480, margin: '0 auto', fontWeight: 500 }}>
              {tagline.subtitle}
            </p>
          </section>
        )}

        {/* BLOCO 5: Oferta */}
        {hasScore && <OfferSection score={score} />}
      </main>

      {hasScore && <StickyCTA score={score} />}
    </div>
  )
}

/* ── Sub-components ── */

function ScoreCard({ score, scoreColor, loading }: { score: number; scoreColor: string; loading: boolean }) {
  const { value: animatedScore } = useCountUp(score)

  return (
    <div style={{
      padding: '28px 24px', borderRadius: 16,
      background: 'var(--card-subtle)', border: '1px solid var(--border-card)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
        Sua nota
      </p>
      <div style={{
        width: 110, height: 110, borderRadius: '50%',
        border: `3px solid ${loading ? 'var(--border-card)' : scoreColor}`,
        boxShadow: loading ? 'none' : `0 0 24px ${scoreColor}22, inset 0 0 20px ${scoreColor}08`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
        transition: 'border-color 0.6s, box-shadow 0.6s',
      }}>
        {loading ? (
          <>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>calculando...</span>
          </>
        ) : (
          <>
            <span className="font-mono font-bold" style={{ fontSize: 44, lineHeight: 1, color: scoreColor }}>{animatedScore}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>de 100</span>
          </>
        )}
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 260 }}>
        {loading
          ? 'Coletando dados do seu Google Meu Negócio...'
          : `Seu perfil só aparece para ${score}% de quem procura pelo seu serviço na região.`}
      </p>
    </div>
  )
}

function MapCard({ mapa, radiusKm, totalZones, weakCount }: {
  mapa: NonNullable<ReturnType<typeof useDiagnostico>['data']>['mapa']
  radiusKm: number; totalZones: number; weakCount: number
}) {
  if (!mapa) return null

  if (mapa.zonas.length <= 1) {
    return (
      <div style={{ padding: '24px', borderRadius: 16, background: 'var(--card-subtle)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
          Onde você aparece no Google
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6, maxWidth: 280 }}>
          Seu negócio atende por área de serviço. O mapa de bairros aparece para negócios com endereço fixo.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', borderRadius: 16, background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
        Onde você aparece no Google
      </p>
      <div style={{ height: 220, borderRadius: 10, overflow: 'hidden', marginBottom: 12, border: '1px solid var(--border-subtle)' }}>
        <DiagMapContent center={mapa.center} zones={mapa.zonas} radiusKm={radiusKm} />
      </div>
      <div className="flex flex-wrap gap-4" style={{ marginBottom: 10 }}>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', boxShadow: '0 0 4px rgba(74,222,128,0.5)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Forte</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FBBF24', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Moderado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fraco</span>
        </div>
      </div>
      <ul style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, listStyle: 'none', padding: 0, margin: 0 }}>
        <li>Seu perfil alcança um raio de apenas <strong style={{ color: 'var(--text-primary)' }}>{radiusKm} km</strong></li>
        <li>Você está presente em {totalZones === 1 ? 'apenas 1 região' : `${totalZones} regiões`}
          {weakCount > 0 && <>, com <strong style={{ color: 'var(--error)' }}>{weakCount} {weakCount === 1 ? 'área fraca' : 'áreas fracas'}</strong></>}
        </li>
      </ul>
    </div>
  )
}
