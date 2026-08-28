import useSWR from 'swr'
import { useState } from 'react'
import { fetcher } from '@/lib/swr/fetcher'

interface AggregatedKeyword {
  keyword: string
  impressions: number
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
}

interface KeywordSuggestion {
  keyword: string
  autocomplete: boolean
}

type Tab = 'searches' | 'suggestions'

export function useKeywords() {
  const [tab, setTab] = useState<Tab>('searches')
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false)

  const {
    data: keywordsData,
    error,
    isLoading,
  } = useSWR<{ keywords: AggregatedKeyword[] }>('/api/keywords', fetcher)

  const {
    data: suggestionsData,
    error: suggestionsError,
    isLoading: suggestionsLoading,
  } = useSWR<{ suggestions: KeywordSuggestion[] }>(
    tab === 'suggestions' ? '/api/keywords/suggestions' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onSuccess: () => setSuggestionsLoaded(true),
    },
  )

  const keywords = keywordsData?.keywords ?? []
  const suggestions = suggestionsData?.suggestions ?? []

  return {
    tab,
    setTab,
    keywords,
    suggestions,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Não foi possível carregar. Tente novamente.') : null,
    suggestionsLoading,
    suggestionsError: suggestionsError
      ? suggestionsError instanceof Error
        ? suggestionsError.message
        : 'Não foi possível gerar sugestões.'
      : null,
    suggestionsLoaded,
  }
}
