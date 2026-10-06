'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useDiagnostico } from '@/components/diagnostico/useDiagnostico'
import CompetitorsSection from '@/components/diagnostico/CompetitorsSection'
import ReviewsSection from '@/components/diagnostico/ReviewsSection'
import OfferSection from '@/components/diagnostico/OfferSection'
import StickyCTA from '@/components/diagnostico/StickyCTA'
import { Logo } from '@/components/ui/Logo'
import type { DiagGap } from '@/components/diagnostico/useDiagnostico'

const DiagMapContent = dynamic(() => import('@/components/diagnostico/DiagMapContent'), { ssr: false })

/* ── Helpers ── */

function useCountUp(target: number, duration = 1200) {
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [value, setValue] = useState(reducedMotion ? target : 0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reducedMotion) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, { threshold: 0.3 })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
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

/* ── Page ── */

export default function DiagnosticoPage() {
  const { data, isLoading, error } = useDiagnostico()

  if (isLoading || error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <div
            style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid var(--accent)',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }}
          />
          <p className="font-display font-bold" style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
            Analisando seu perfil
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
            Isso leva alguns segundos.
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (data.score.atual === 0 && data.gaps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center max-w-md px-6">
          <p className="font-display font-bold" style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 12 }}>
            Estamos coletando dados de {data.perfil.nome || 'seu perfil'}
          </p>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            A análise do seu perfil no Google está em andamento. Você receberá um email quando o diagnóstico estiver pronto.
          </p>
        </div>
      </div>
    )
  }

  const nome = data.perfil.nome || 'Seu negócio'
  const endereco = data.perfil.endereco || ''
  const score = data.score.atual
  const scoreColor = getScoreColor(score)
  const userRating = data.reviews.ultima?.nota ?? 0
  const userReviewCount = data.reviews.sem_resposta_count + (data.reviews.ultima ? 1 : 0)

  // Quick wins summary
  const rapidos = data.gaps.filter(g => categorizeGap(g) === 'rapido')
  const estrategicos = data.gaps.filter(g => categorizeGap(g) === 'estrategico')
  const continuos = data.gaps.filter(g => categorizeGap(g) === 'continuo')
  const rapidoImpact = rapidos.reduce((s, g) => s + g.impact, 0)
  const estrategicoImpact = estrategicos.reduce((s, g) => s + g.impact, 0)

  // Map data
  const mapa = data.mapa
  const strongCount = mapa?.zonas.filter(z => z.status === 'strong').length ?? 0
  const weakCount = mapa?.zonas.filter(z => z.status === 'weak').length ?? 0
  const totalZones = mapa?.zonas.length ?? 0
  const radiusKm = mapa?.radius_km ?? 0

  return (
    <DiagnosticoContent
      nome={nome}
      endereco={endereco}
      score={score}
      scoreColor={scoreColor}
      userRating={userRating}
      userReviewCount={userReviewCount}
      rapidos={rapidos}
      estrategicos={estrategicos}
      continuos={continuos}
      rapidoImpact={rapidoImpact}
      estrategicoImpact={estrategicoImpact}
      mapa={mapa}
      strongCount={strongCount}
      weakCount={weakCount}
      totalZones={totalZones}
      radiusKm={radiusKm}
      data={data}
    />
  )
}

function DiagnosticoContent({
  nome, endereco, score, scoreColor, userRating, userReviewCount,
  rapidos, estrategicos, continuos, rapidoImpact, estrategicoImpact,
  mapa, strongCount, weakCount, totalZones, radiusKm, data,
}: {
  nome: string
  endereco: string
  score: number
  scoreColor: string
  userRating: number
  userReviewCount: number
  rapidos: DiagGap[]
  estrategicos: DiagGap[]
  continuos: DiagGap[]
  rapidoImpact: number
  estrategicoImpact: number
  mapa: typeof data.mapa
  strongCount: number
  weakCount: number
  totalZones: number
  radiusKm: number
  data: NonNullable<ReturnType<typeof useDiagnostico>['data']>
}) {
  const { value: animatedScore, ref: scoreRef } = useCountUp(score)

  return (
    <div ref={scoreRef} className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        className="sticky top-0"
        style={{ zIndex: 40, background: 'rgba(7,26,25,0.95)', backdropFilter: 'blur(12px)', height: 56 }}
      >
        <div className="max-w-[900px] mx-auto px-6 h-full flex items-center">
          <Logo size="md" href="https://destaka.com.br" vertical="Saúde" />
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 pb-28">

        {/* ═══ BLOCO 1: Hero (Score + Mapa lado a lado) ═══ */}
        <section style={{ paddingTop: 40, paddingBottom: 32 }}>
          <style>{`
            @media (max-width: 640px) {
              .hero-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
          <div
            className="hero-grid grid gap-6"
            style={{ gridTemplateColumns: '1fr 1.85fr' }}
          >
            {/* Coluna esquerda: Score */}
            <div
              style={{
                padding: '28px 24px',
                borderRadius: 16,
                background: 'var(--card-subtle)',
                border: '1px solid var(--border-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}
              >
                Sua nota
              </p>
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  border: `3px solid ${scoreColor}`,
                  boxShadow: `0 0 24px ${scoreColor}22, inset 0 0 20px ${scoreColor}08`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <span className="font-mono font-bold" style={{ fontSize: 44, lineHeight: 1, color: scoreColor }}>
                  {animatedScore}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>de 100</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 260 }}>
                Seu perfil só aparece para {score}% de quem procura pelo seu serviço na região.
              </p>
            </div>

            {/* Coluna direita: Mapa */}
            {mapa && (
              <div
                style={{
                  padding: '24px',
                  borderRadius: 16,
                  background: 'var(--card-subtle)',
                  border: '1px solid var(--border-card)',
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}
                >
                  Onde você aparece no Google
                </p>
                <div
                  style={{
                    height: 220,
                    borderRadius: 10,
                    overflow: 'hidden',
                    marginBottom: 12,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <DiagMapContent center={mapa.center} zones={mapa.zonas} radiusKm={radiusKm} />
                </div>
                {/* Legenda do mapa */}
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
            )}
          </div>
        </section>

        {/* ═══ BLOCO 2: Impacto + Quick Wins resumo + CTA ═══ */}
        <section style={{ paddingBottom: 48, textAlign: 'center' }}>
          <h2
            className="font-display font-bold"
            style={{ fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 6 }}
          >
            Você está perdendo até 3 clientes por semana.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 24 }}>
            O Destaka ajuda você a conquistar esses clientes.
          </p>

          {/* Barras de quick wins (só dados reais) */}
          <div className="flex flex-col gap-3 text-left" style={{ maxWidth: 560, margin: '0 auto 28px' }}>
            {rapidos.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
                  {rapidos.length} {rapidos.length === 1 ? 'ajuste rápido' : 'ajustes rápidos'} = <span className="font-mono">+{rapidoImpact} pontos</span> em 7 dias
                </p>
              </div>
            )}
            {estrategicos.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--warning-bg)',
                  border: '1px solid var(--warning-border)',
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)' }}>
                  {estrategicos.length} {estrategicos.length === 1 ? 'ajuste estratégico' : 'ajustes estratégicos'} = <span className="font-mono">+{estrategicoImpact} pontos</span> em 30 dias
                </p>
              </div>
            )}
            {continuos.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--accent-bg)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-bright)' }}>
                  {continuos.length} {continuos.length === 1 ? 'melhoria contínua' : 'melhorias contínuas'} para manter primeiras posições
                </p>
              </div>
            )}
          </div>

          {/* CTA primário */}
          <a
            href="/api/stripe/checkout"
            className="inline-block font-semibold"
            style={{
              padding: '16px 48px',
              borderRadius: 14,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 16,
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(20,184,166,0.3)',
              transition: 'transform 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(20,184,166,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(20,184,166,0.3)' }}
          >
            {getCtaText(score)}
          </a>
        </section>

        {/* ═══ BLOCO 3: Concorrentes ═══ */}
        {data.concorrentes.length > 0 && (
          <div style={{ paddingBottom: 48 }}>
            <CompetitorsSection
              concorrentes={data.concorrentes}
              userRating={userRating}
              userReviewCount={userReviewCount}
              userName={nome}
            />
          </div>
        )}

        {/* ═══ BLOCO 4: Avaliações ═══ */}
        <div style={{ paddingBottom: 48 }}>
          <ReviewsSection
            unansweredCount={data.reviews.sem_resposta_count}
            lastReviewDate={data.reviews.ultima?.data ?? null}
          />
        </div>

        {/* ═══ Tagline de transição ═══ */}
        <section className="text-center" style={{ paddingBottom: 48 }}>
          <h2
            className="font-display font-bold"
            style={{
              fontSize: 26,
              color: 'var(--text-primary)',
              lineHeight: 1.35,
              maxWidth: 560,
              margin: '0 auto 12px',
              letterSpacing: '-0.3px',
            }}
          >
            Você cuida de atender seus pacientes.
          </h2>
          <p
            style={{
              fontSize: 18,
              color: 'var(--accent-bright)',
              lineHeight: 1.5,
              maxWidth: 480,
              margin: '0 auto',
              fontWeight: 500,
            }}
          >
            Nós cuidamos de fazer novos pacientes chegar até você.
          </p>
        </section>

        {/* ═══ BLOCO 5: Oferta ═══ */}
        <OfferSection score={score} />
      </main>

      <StickyCTA score={score} />
    </div>
  )
}
