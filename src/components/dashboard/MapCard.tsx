'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

interface MapZone {
  lat: number
  lng: number
  label: string
  count: number
  status: 'strong' | 'medium' | 'weak'
}

interface MapData {
  center: { lat: number; lng: number }
  zones: MapZone[]
  radius_km: number
  total_neighborhoods: number
  week_start?: string
  empty?: boolean
  message?: string
}

const MapContent = dynamic(() => import('./MapContent'), { ssr: false })

export default function MapCard({ isSubscriber }: { isSubscriber: boolean }) {
  const [data, setData] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSubscriber) {
      setLoading(false) // eslint-disable-line react-hooks/set-state-in-effect -- guard clause
      return
    }
    fetch('/api/dashboard/map')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((d: MapData) => {
        if (d && !('paywall' in d)) setData(d)
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [isSubscriber])

  const strongCount = data?.zones?.filter(z => z.status === 'strong').length ?? 0
  const weakCount = data?.zones?.filter(z => z.status === 'weak').length ?? 0

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--card-subtle)',
        border: '1px solid var(--border-card)',
        minHeight: 340,
      }}
    >
      <p
        className="text-[10px] font-medium tracking-[0.08em] uppercase mb-3"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        Onde você aparece
      </p>
      <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Seu alcance no Google Maps
      </p>

      {loading && (
        <div className="h-[240px] sm:h-[280px] flex items-center justify-center">
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Carregando mapa...</p>
        </div>
      )}

      {!loading && !isSubscriber && (
        <div className="relative">
          <div className="h-[240px] sm:h-[280px] rounded-xl overflow-hidden" style={{ filter: 'blur(4px)', opacity: 0.7 }}>
            <MapContent
              center={{ lat: -23.5505, lng: -46.6333 }}
              zones={[
                { lat: -23.5505, lng: -46.6333, label: 'Seu negócio', count: 80, status: 'strong' },
                { lat: -23.5600, lng: -46.6450, label: 'Zona próxima', count: 40, status: 'medium' },
                { lat: -23.5400, lng: -46.6200, label: 'Área descoberta', count: 10, status: 'weak' },
              ]}
            />
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            <svg className="w-8 h-8 mb-2" style={{ color: 'rgba(255,255,255,0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-[13px] font-medium mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Descubra em quais bairros você está invisível
            </p>
            <Link
              href="/dashboard/upgrade"
              className="text-[13px] font-medium px-4 py-2 rounded-xl text-white transition-all hover:brightness-110"
              style={{ background: 'var(--accent)' }}
            >
              Descobrir onde estou invisível
            </Link>
          </div>
        </div>
      )}

      {!loading && isSubscriber && (!data || data.empty) && (
        <div className="h-[240px] sm:h-[280px] flex items-center justify-center px-4">
          <p className="text-[13px] text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Estamos mapeando seu alcance. Recarregue em alguns minutos.
          </p>
        </div>
      )}

      {!loading && isSubscriber && data && !data.empty && data.zones.length <= 1 && (
        <div className="h-[240px] sm:h-[280px] flex items-center justify-center px-6">
          <p className="text-[13px] text-center" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
            Seu negócio atende por área de serviço. O mapa de bairros aparece para negócios com endereço fixo.
          </p>
        </div>
      )}

      {!loading && isSubscriber && data && !data.empty && data.zones.length > 1 && (
        <div className="relative">
          <div className="h-[240px] sm:h-[280px] rounded-xl overflow-hidden">
            <MapContent center={data.center} zones={data.zones} radiusKm={data.radius_km} />
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-3 px-1">
            {[
              { color: '#22c55e', label: 'Forte' },
              { color: '#eab308', label: 'Médio' },
              { color: '#ef4444', label: 'Fraco' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="rounded-full" style={{ width: 7, height: 7, background: item.color }} />
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1.5">
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Seu negócio aparece em{' '}
              <span className="font-medium text-white">
                {data.total_neighborhoods} {data.total_neighborhoods === 1 ? 'bairro' : 'bairros'}
              </span>
              {data.radius_km > 0 && (
                <span style={{ color: 'rgba(255,255,255,0.45)' }}> (raio de {data.radius_km} km)</span>
              )}
            </p>
            {strongCount > 0 && (
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {strongCount} {strongCount === 1 ? 'bairro com boa visibilidade' : 'bairros com boa visibilidade'}
                {weakCount > 0 && `, ${weakCount} ${weakCount === 1 ? 'precisa melhorar' : 'precisam melhorar'}`}
              </p>
            )}
            {weakCount > 0 && (
              <p className="text-[12px] font-medium" style={{ color: 'var(--warning)' }}>
                O Destaka está trabalhando para expandir seu alcance
              </p>
            )}
            {weakCount === 0 && strongCount > 0 && (
              <p className="text-[12px] font-medium" style={{ color: 'var(--success)' }}>
                Você está bem posicionado na sua região
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
