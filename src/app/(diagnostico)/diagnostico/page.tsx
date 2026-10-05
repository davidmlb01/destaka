'use client'

import { useDiagnostico } from '@/components/diagnostico/useDiagnostico'
import AnalyzingState from '@/components/diagnostico/AnalyzingState'
import ScoreBlock from '@/components/diagnostico/ScoreBlock'
import MapBlock from '@/components/diagnostico/MapBlock'
import CompetitorsBlock from '@/components/diagnostico/CompetitorsBlock'
import ReviewsBlock from '@/components/diagnostico/ReviewsBlock'
import OfferBlock from '@/components/diagnostico/OfferBlock'
import StickyCTA from '@/components/diagnostico/StickyCTA'
import AnimatedBlock from '@/components/diagnostico/AnimatedBlock'

export default function DiagnosticoPage() {
  const { data, isLoading, error } = useDiagnostico()

  // Estado de loading / erro
  if (isLoading) {
    return <AnalyzingState profileName="seu perfil" />
  }

  if (error || !data) {
    return <AnalyzingState profileName="seu perfil" />
  }

  // Se score e 0 e nao tem gaps, dados ainda nao foram processados
  if (data.score.atual === 0 && data.gaps.length === 0) {
    return <AnalyzingState profileName={data.perfil.nome || 'seu perfil'} />
  }

  const nome = data.perfil.nome || ''
  const especialidade = data.perfil.categoria || 'sua especialidade'
  const subtitulo = nome
    ? `${nome}, veja como seus pacientes encontram (ou nao encontram) voce hoje.`
    : 'Veja como seus pacientes encontram (ou nao encontram) voce hoje.'

  // Rating do usuario (da review ou concorrentes)
  const userRating = data.reviews.ultima?.nota ?? 0
  const userReviewCount = data.reviews.sem_resposta_count + (data.reviews.ultima ? 1 : 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header minimo */}
      <header
        className="sticky top-0"
        style={{
          zIndex: 40,
          background: 'var(--bg-base)',
          height: 64,
        }}
      >
        <div className="max-w-[1024px] mx-auto px-6 md:px-12 h-full flex items-center gap-3">
          {/* Logo sparkle */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
          </svg>
          <a
            href="https://destaka.com.br"
            className="font-display font-bold"
            style={{ fontSize: 18, color: 'var(--text-primary)', letterSpacing: '0.5px', textDecoration: 'none' }}
          >
            Destaka
          </a>
        </div>
      </header>

      {/* Conteudo principal */}
      <main className="max-w-[1024px] mx-auto px-6 md:px-12 pb-24">
        {/* Titulo da pagina */}
        <div className="pt-8 mb-12">
          <h1
            className="font-display font-bold"
            style={{ fontSize: 24, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.5px' }}
          >
            Diagnostico do seu Perfil no Google
          </h1>
          <p className="mt-3" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {subtitulo}
          </p>
        </div>

        {/* Blocos */}
        <div className="flex flex-col" style={{ gap: 48 }}>
          {/* Bloco Score */}
          <AnimatedBlock>
            <ScoreBlock
              score={data.score.atual}
              projectedScore={data.score.projetado}
              gaps={data.gaps}
              especialidade={especialidade}
            />
          </AnimatedBlock>

          {/* Bloco Mapa */}
          {data.mapa && (
            <AnimatedBlock delay={100}>
              <MapBlock
                center={data.mapa.center}
                zones={data.mapa.zonas}
                radiusKm={data.mapa.radius_km}
                especialidade={especialidade}
              />
            </AnimatedBlock>
          )}

          {/* Bloco Concorrentes */}
          {data.concorrentes.length > 0 && (
            <AnimatedBlock delay={200}>
              <CompetitorsBlock
                concorrentes={data.concorrentes}
                userRating={userRating}
                userReviewCount={userReviewCount}
                userName={nome}
                especialidade={especialidade}
              />
            </AnimatedBlock>
          )}

          {/* Bloco Avaliacoes */}
          <AnimatedBlock delay={300}>
            <ReviewsBlock
              unansweredCount={data.reviews.sem_resposta_count}
              lastReviewDate={data.reviews.ultima?.data ?? null}
            />
          </AnimatedBlock>

          {/* Separador visual dados > proposta */}
          <div
            className="mx-auto"
            style={{
              width: '80%',
              height: 1,
              background: 'linear-gradient(90deg, transparent, var(--border-accent), transparent)',
              marginTop: 16,
              marginBottom: 16,
            }}
          />

          {/* Bloco Oferta */}
          <AnimatedBlock delay={400}>
            <OfferBlock score={data.score.atual} />
          </AnimatedBlock>
        </div>
      </main>

      {/* CTA Fixo Mobile */}
      <StickyCTA score={data.score.atual} />
    </div>
  )
}
