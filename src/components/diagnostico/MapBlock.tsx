'use client'

import dynamic from 'next/dynamic'
import type { DiagMapZone } from './useDiagnostico'

const DiagMapContent = dynamic(() => import('./DiagMapContent'), { ssr: false })

interface MapBlockProps {
  center: { lat: number; lng: number }
  zones: DiagMapZone[]
  radiusKm: number
  especialidade: string
}

export default function MapBlock({ center, zones, radiusKm, especialidade }: MapBlockProps) {
  return (
    <section aria-labelledby="map-heading">
      <h2
        id="map-heading"
        className="font-display font-bold mb-6"
        style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px' }}
      >
        De onde vem seus pacientes
      </h2>

      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Mapa */}
        <div
          className="w-full md:w-[60%] flex-shrink-0 overflow-hidden"
          style={{
            height: 280,
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <DiagMapContent center={center} zones={zones} />
        </div>

        {/* Copy */}
        <div className="mt-6 md:mt-0 md:flex-1 flex flex-col justify-center">
          <p
            className="font-mono font-bold mb-4"
            style={{ fontSize: 28, color: 'var(--accent-bright)', lineHeight: 1, letterSpacing: '-0.5px' }}
          >
            Raio atual: {radiusKm} km
          </p>

          <p className="mb-3" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Hoje, seu perfil alcança pacientes em um raio de aproximadamente {radiusKm} km. Fora dessa área, quem procura por {especialidade} encontra outros profissionais.
          </p>

          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Profissionais que otimizam seu perfil no Google alcançam até 3x mais bairros. Com o Destaka, seu consultório aparece para pacientes que antes nem sabiam que você existia.
          </p>

          <p className="mt-4" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Verde: áreas onde você aparece. Cinza: áreas onde seus concorrentes aparecem e você não.
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          section[aria-labelledby="map-heading"] [style*="height: 280px"] {
            height: 360px !important;
          }
        }
      `}</style>
    </section>
  )
}
