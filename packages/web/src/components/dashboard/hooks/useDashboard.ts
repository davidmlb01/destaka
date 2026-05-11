import useSWR from 'swr'
import { useState } from 'react'
import { fetcher } from '@/lib/swr/fetcher'
import type { CategoryScore } from '@/lib/gmb/scorer'

interface DashboardData {
  profile: { id: string; name: string; address: string; score: number; last_synced_at: string | null }
  diagnostic: (Record<string, number> & { id?: string; issues: Array<{ field: string; severity: string; message: string; impact: number }> }) | null
  scoreHistory: Array<{ score_total: number; created_at: string }>
  recentActions: Array<{ id: string; type: string; status: string; created_at: string }>
  metrics: { viewsSearch: number; viewsMaps: number; clicksWebsite: number; clicksCall: number; clicksDirections: number; period: string }
  nextActions: Array<{ field: string; message: string; impact: number; severity: string }>
  weeklySummary: { posts_published: number; reviews_replied: number; score_delta: number } | null
}

const FIELD_MAP: Record<string, string[]> = {
  info: ['name', 'phone', 'address', 'hours', 'website', 'category'],
  photos: ['logo', 'space_photos', 'total_photos', 'cover'],
  reviews: ['reviews_count', 'rating', 'reply_rate'],
  posts: ['posts', 'post_recency'],
  services: ['services_count', 'services_desc'],
  attributes: ['attributes'],
}

const CATEGORY_META = [
  { key: 'info', label: 'Informações Básicas', max: 25, scoreField: 'score_info_basica' },
  { key: 'photos', label: 'Fotos', max: 20, scoreField: 'score_fotos' },
  { key: 'reviews', label: 'Avaliações', max: 25, scoreField: 'score_avaliacoes' },
  { key: 'posts', label: 'Posts', max: 15, scoreField: 'score_posts' },
  { key: 'services', label: 'Serviços', max: 10, scoreField: 'score_servicos' },
  { key: 'attributes', label: 'Atributos', max: 5, scoreField: 'score_atributos' },
]

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>('/api/dashboard', fetcher)
  const [syncing, setSyncing] = useState(false)

  const diagnosticId = data?.diagnostic?.id ?? ''

  const categories: CategoryScore[] = CATEGORY_META.map((m) => {
    const score = data?.diagnostic ? ((data.diagnostic[m.scoreField] as number) ?? 0) : 0
    const issues = !data?.diagnostic
      ? []
      : (data.diagnostic.issues ?? [])
          .filter((i) => FIELD_MAP[m.key]?.includes(i.field))
          .map((i) => ({ ...i, severity: i.severity as 'critical' | 'warning' | 'info' }))
    return {
      name: m.key,
      label: m.label,
      score,
      maxScore: m.max,
      percentage: Math.round((score / m.max) * 100),
      issues,
    }
  })

  const lastSync = data?.profile.last_synced_at
    ? new Date(data.profile.last_synced_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'nunca'

  async function handleSync() {
    if (!data || syncing) return
    setSyncing(true)
    await fetch('/api/diagnostic/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: data.profile.id }),
    })
    await mutate()
    setSyncing(false)
  }

  return {
    data,
    error,
    isLoading,
    mutate,
    syncing,
    diagnosticId,
    categories,
    lastSync,
    handleSync,
  }
}
