'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export interface DiagGap {
  field: string
  severity: string
  message: string
  impact: number
}

export interface DiagConcorrente {
  name: string
  place_id: string
  avg_rating: number | null
  review_count: number
}

export interface DiagMapZone {
  lat: number
  lng: number
  label: string
  count: number
  status: 'strong' | 'medium' | 'weak'
}

export interface DiagnosticoData {
  score: {
    atual: number
    projetado: number
    faixa: string
    tendencia: string
    snapshot_date: string | null
  }
  categorias: Record<string, { pontos: number; max: number; label: string }>
  gaps: DiagGap[]
  concorrentes: DiagConcorrente[]
  mapa: {
    center: { lat: number; lng: number }
    radius_km: number
    zonas: DiagMapZone[]
    week_start: string
  } | null
  keywords: Array<{ keyword: string; impressions: number; clicks: number; week_start: string }>
  metricas: {
    views_search: number
    views_maps: number
    clicks_website: number
    clicks_call: number
    clicks_directions: number
    period: string
    source: 'api' | 'database' | 'none'
  }
  reviews: {
    ultima: { autor: string; nota: number; comentario: string | null; data: string } | null
    sem_resposta_count: number
  }
  perfil: {
    nome: string
    endereco: string
    categoria: string
    latitude: number | null
    longitude: number | null
    google_place_id: string | null
    descricao: string | null
    total_fotos: number
  }
}

export function useDiagnostico() {
  const { data, error, isLoading } = useSWR<DiagnosticoData>(
    '/api/diagnostico',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
  return { data, error, isLoading }
}
