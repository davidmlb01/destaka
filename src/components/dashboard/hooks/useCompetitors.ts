import useSWR from 'swr'
import { useState } from 'react'
import { fetcher } from '@/lib/swr/fetcher'
import { apiFetch } from '@/lib/api/client'
import type { Competitor } from '@/lib/gmb/competitors'

interface Profile {
  id: string
  name: string
  avg_rating: number | null
  review_count: number | null
}

interface CompetitorsData {
  profile: Profile
  competitors: Competitor[]
}

export function useCompetitors() {
  const { data, error, isLoading, mutate } = useSWR<CompetitorsData>('/api/competitors', fetcher)
  const [discovering, setDiscovering] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleDiscover() {
    setDiscovering(true)
    setMsg('')
    const { data: json, error } = await apiFetch<{ discovered: number; errors: string[] }>(
      '/api/competitors',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ benchmark: true }),
      },
    )
    if (error || !json) {
      setMsg(error ?? 'Erro ao buscar concorrentes. Tente novamente.')
      setDiscovering(false)
      return
    }
    const n = json.discovered
    setMsg(
      `${n} ${n === 1 ? 'concorrente encontrado' : 'concorrentes encontrados'}${json.errors.length ? ` (${json.errors.length} ${json.errors.length === 1 ? 'erro' : 'erros'})` : ''}.`,
    )
    await mutate()
    setDiscovering(false)
  }

  return {
    data,
    error,
    isLoading,
    discovering,
    msg,
    handleDiscover,
  }
}
