'use client'

import dynamic from 'next/dynamic'
import type { DiagMapZone } from './useDiagnostico'

const DiagMapContent = dynamic(() => import('./DiagMapContent'), { ssr: false })

interface MapSectionProps {
  center: { lat: number; lng: number }
  zones: DiagMapZone[]
  radiusKm: number
  endereco: string
}

export default function MapSection({ center, zones, radiusKm, endereco }: MapSectionProps) {
  const strongCount = zones.filter(z => z.status === 'strong').length
  const weakCount = zones.filter(z => z.status === 'weak').length
  const totalCount = zones.length

  return (
    <section>
      <h2
        className="font-display font-bold"
        style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: 8 }}
      >
        Onde você aparece no Google
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 20 }}>
        {endereco}
      </p>

      {/* Mapa grande, protagonista */}
      <div
        style={{
          height: 340,
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <DiagMapContent center={center} zones={zones} radiusKm={radiusKm} />
      </div>

      {/* Legenda + métricas */}
      <div className="flex flex-wrap gap-4" style={{ marginBottom: 16 }}>
        <div className="flex items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Forte</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FBBF24', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Moderado</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Fraco</span>
        </div>
      </div>

      {/* Copy de impacto */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: 'var(--card-subtle)',
          border: '1px solid var(--border-card)',
        }}
      >
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Seu perfil alcança clientes em um raio de <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{radiusKm} km</strong>.
          {weakCount > 0 && (
            <> Existem <strong style={{ color: 'var(--error)' }}>{weakCount} {weakCount === 1 ? 'área fraca' : 'áreas fracas'}</strong> onde seus concorrentes aparecem e você não.</>
          )}
          {weakCount === 0 && totalCount > 0 && (
            <> Você está presente em {strongCount} {strongCount === 1 ? 'região' : 'regiões'}.</>
          )}
        </p>
      </div>
    </section>
  )
}
