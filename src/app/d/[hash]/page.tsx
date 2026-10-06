'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Logo } from '@/components/ui/Logo'

const DiagMapContent = dynamic(() => import('@/components/diagnostico/DiagMapContent'), { ssr: false })

interface PublicDiagData {
  score: { atual: number; projetado: number; faixa: string; snapshot_date: string | null }
  categorias: Record<string, { pontos: number; max: number; label: string }>
  gaps: Array<{ field: string; severity: string; message: string; impact: number }>
  mapa: { center: { lat: number; lng: number }; radius_km: number; total_zonas: number; week_start: string } | null
  perfil: { nome: string; endereco: string; categoria: string; total_fotos: number }
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--success)'
  if (score >= 40) return 'var(--warning)'
  return 'var(--error)'
}

function getCtaText(score: number): string {
  if (score < 30) return 'Corrigir meu perfil agora'
  if (score < 50) return 'Quero mais clientes'
  if (score <= 70) return 'Liderar minha região'
  return 'Manter minha liderança'
}

export default function PublicDiagnosticoPage() {
  const params = useParams()
  const hash = params.hash as string
  const [data, setData] = useState<PublicDiagData | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hash) return
    fetch(`/api/diagnostico/${hash}`)
      .then(res => {
        if (!res.ok) throw new Error('not found')
        return res.json()
      })
      .then((d: PublicDiagData) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [hash])

  if (loading) {
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
            Carregando diagnóstico
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center max-w-md px-6">
          <p className="font-display font-bold" style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 12 }}>
            Diagnóstico não encontrado
          </p>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Este link pode ter expirado ou ser inválido.
          </p>
          <a
            href="https://destaka.com.br"
            className="inline-block font-semibold"
            style={{
              marginTop: 24,
              padding: '12px 32px',
              borderRadius: 12,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            Conhecer o Destaka
          </a>
        </div>
      </div>
    )
  }

  const score = data.score.atual
  const scoreColor = getScoreColor(score)
  const nome = data.perfil.nome || 'Negócio'
  const totalGapImpact = data.gaps.reduce((s, g) => s + g.impact, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{ background: 'rgba(7,26,25,0.95)', backdropFilter: 'blur(12px)', height: 56 }}>
        <div className="max-w-[900px] mx-auto px-6 h-full flex items-center justify-between">
          <Logo size="md" href="https://destaka.com.br" vertical="Saúde" />
          <a
            href="https://destaka.com.br/verificar"
            className="font-semibold"
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Fazer meu diagnóstico
          </a>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 pb-20">
        {/* Nome + Score */}
        <section style={{ paddingTop: 32, paddingBottom: 32 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Diagnóstico de visibilidade
          </p>
          <h1
            className="font-display font-bold"
            style={{ fontSize: 24, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: 24 }}
          >
            {nome}
          </h1>

          <div className="flex items-center gap-6 flex-wrap">
            {/* Score circle */}
            <div
              style={{
                width: 110, height: 110, borderRadius: '50%',
                border: `3px solid ${scoreColor}`,
                boxShadow: `0 0 24px ${scoreColor}22`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="font-mono font-bold" style={{ fontSize: 44, lineHeight: 1, color: scoreColor }}>
                {score}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>de 100</span>
            </div>
            <div>
              <p style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
                {score < 30 ? 'Perfil praticamente invisível' : score < 50 ? 'Abaixo da média da região' : score < 70 ? 'Potencial não aproveitado' : 'Bem posicionado'}
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {nome} aparece para apenas {score}% de quem busca pelo serviço na região.
              </p>
            </div>
          </div>
        </section>

        {/* Gaps / Quick wins */}
        {data.gaps.length > 0 && (
          <section style={{ paddingBottom: 40 }}>
            <h2
              className="font-display font-bold"
              style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 8 }}
            >
              {data.gaps.length} {data.gaps.length === 1 ? 'oportunidade identificada' : 'oportunidades identificadas'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Corrigir esses pontos pode aumentar o score em até <strong className="font-mono" style={{ color: 'var(--accent-bright)' }}>+{totalGapImpact} pontos</strong>.
            </p>
            <div className="flex flex-col gap-2">
              {data.gaps.map((g, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'var(--card-subtle)',
                    border: '1px solid var(--border-card)',
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{g.message}</span>
                  <span className="font-mono" style={{ fontSize: 13, color: 'var(--accent-bright)', flexShrink: 0, marginLeft: 12 }}>
                    +{g.impact}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="text-center" style={{ paddingBottom: 48 }}>
          <h2
            className="font-display font-bold"
            style={{ fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.35, maxWidth: 480, margin: '0 auto 8px' }}
          >
            Você cuida de atender seus pacientes.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--accent-bright)', marginBottom: 24, fontWeight: 500 }}>
            Nós cuidamos de fazer novos pacientes chegar até você.
          </p>
          <a
            href="https://destaka.com.br/verificar"
            className="inline-block font-semibold"
            style={{
              padding: '16px 48px',
              borderRadius: 14,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 16,
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(20,184,166,0.3)',
            }}
          >
            Fazer meu diagnóstico gratuito
          </a>
        </section>
      </main>
    </div>
  )
}
