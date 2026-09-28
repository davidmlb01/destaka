import useSWR from 'swr'
import { fetcher } from '@/lib/swr/fetcher'

interface CompetitiveGap {
  type: string
  priority: 'high' | 'medium' | 'low'
  gap_description: string
  competitor_values: string[]
  client_values: string[]
  missing: string[]
  suggested_action: { type: string; label: string; description: string; impact: number } | null
  impact_score: number
}

interface CompetitiveAnalysis {
  gaps: CompetitiveGap[]
  keyword_opportunities: string[]
  summary: string
  analyzed_at: string | null
}

export function useCompetitiveAnalysis() {
  const { data, error, isLoading } = useSWR<CompetitiveAnalysis>(
    '/api/competitors/analysis',
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    analysis: data,
    error,
    isLoading,
  }
}
