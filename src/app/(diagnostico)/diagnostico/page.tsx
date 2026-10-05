'use client'

import { useDiagnostico } from '@/components/diagnostico/useDiagnostico'
import HeroScore from '@/components/diagnostico/HeroScore'
import MapSection from '@/components/diagnostico/MapSection'
import QuickWins from '@/components/diagnostico/QuickWins'
import CompetitorsSection from '@/components/diagnostico/CompetitorsSection'
import ReviewsSection from '@/components/diagnostico/ReviewsSection'
import OfferSection from '@/components/diagnostico/OfferSection'
import StickyCTA from '@/components/diagnostico/StickyCTA'
import { Logo } from '@/components/ui/Logo'

export default function DiagnosticoPage() {
  const { data, isLoading, error } = useDiagnostico()

  // Loading
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

  // Dados ainda não processados
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
  const userRating = data.reviews.ultima?.nota ?? 0
  const userReviewCount = data.reviews.sem_resposta_count + (data.reviews.ultima ? 1 : 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        className="sticky top-0"
        style={{ zIndex: 40, background: 'rgba(7,26,25,0.95)', backdropFilter: 'blur(12px)', height: 56 }}
      >
        <div className="max-w-[900px] mx-auto px-6 h-full flex items-center">
          <Logo size="xs" href="https://destaka.com.br" vertical="Saúde" />
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 pb-28">
        {/* BLOCO 1: Score (protagonista) */}
        <div style={{ paddingTop: 40, paddingBottom: 48 }}>
          <HeroScore
            score={data.score.atual}
            projetado={data.score.projetado}
            nome={nome}
            endereco={endereco}
          />
        </div>

        {/* BLOCO 2: Mapa (segundo protagonista) */}
        {data.mapa && (
          <div style={{ paddingBottom: 48 }}>
            <MapSection
              center={data.mapa.center}
              zones={data.mapa.zonas}
              radiusKm={data.mapa.radius_km}
              endereco={endereco}
            />
          </div>
        )}

        {/* BLOCO 3: Quick Wins (instantâneo / médio / longo prazo) */}
        {data.gaps.length > 0 && (
          <div style={{ paddingBottom: 48 }}>
            <QuickWins gaps={data.gaps} />
          </div>
        )}

        {/* BLOCO 4: Concorrentes */}
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

        {/* BLOCO 5: Avaliações */}
        <div style={{ paddingBottom: 48 }}>
          <ReviewsSection
            unansweredCount={data.reviews.sem_resposta_count}
            lastReviewDate={data.reviews.ultima?.data ?? null}
          />
        </div>

        {/* Separador */}
        <div
          className="mx-auto"
          style={{
            width: '60%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, var(--accent-border), transparent)',
            marginBottom: 48,
          }}
        />

        {/* BLOCO 6: Oferta */}
        <OfferSection score={data.score.atual} />
      </main>

      {/* CTA fixo mobile */}
      <StickyCTA score={data.score.atual} />
    </div>
  )
}
