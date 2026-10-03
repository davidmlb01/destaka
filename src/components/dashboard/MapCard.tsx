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
      setLoading(false)
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
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-5">
      <h3 className="text-base font-semibold text-zinc-100 mb-1">Onde voce aparece</h3>
      <p className="text-sm text-zinc-400 mb-3">Seu alcance no Google Maps</p>

      {loading && (
        <div className="h-[300px] sm:h-[400px] flex items-center justify-center text-zinc-500">
          Carregando mapa...
        </div>
      )}

      {!loading && !isSubscriber && !data && (
        <div className="relative">
          <div className="h-[300px] sm:h-[400px] rounded-lg bg-zinc-800/50 blur-sm" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/60 rounded-lg">
            <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-zinc-300 text-sm font-medium mb-2">Assine para ver seu alcance completo</p>
            <Link
              href="/dashboard/upgrade"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Ver meu alcance
            </Link>
          </div>
        </div>
      )}

      {!loading && isSubscriber && (!data || data.empty) && (
        <div className="h-[300px] sm:h-[400px] flex items-center justify-center text-zinc-500 text-center px-4">
          <p>Estamos mapeando seu alcance. Recarregue em alguns minutos.</p>
        </div>
      )}

      {!loading && data && !data.empty && (
        <div className="relative">
          <div
            className={`h-[300px] sm:h-[400px] rounded-lg overflow-hidden ${!isSubscriber ? 'blur-sm pointer-events-none' : ''}`}
          >
            <MapContent center={data.center} zones={data.zones} />
          </div>

          {!isSubscriber && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/60 rounded-lg">
              <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-zinc-300 text-sm font-medium mb-2">Assine para ver seu alcance completo</p>
              <Link
                href="/dashboard/upgrade"
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Ver meu alcance
              </Link>
            </div>
          )}

          {isSubscriber && (
            <div className="mt-3 space-y-1">
              <p className="text-sm text-zinc-300">
                Seu negocio aparece em <span className="font-semibold text-zinc-100">{data.total_neighborhoods} bairros</span>
                {data.radius_km > 0 && (
                  <span className="text-zinc-400"> (raio de {data.radius_km} km)</span>
                )}
              </p>
              {weakCount > 0 && (
                <p className="text-sm text-amber-400">
                  Destaka esta otimizando seu perfil para expandir seu alcance
                </p>
              )}
              {weakCount === 0 && strongCount > 0 && (
                <p className="text-sm text-emerald-400">
                  Voce esta bem posicionado na sua regiao
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
