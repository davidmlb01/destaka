import useSWR from 'swr'
import { useState } from 'react'
import { fetcher } from '@/lib/swr/fetcher'
import type { Review, ReviewFilter } from '@/lib/gmb/reviews'

interface ReviewsData {
  reviews: Review[]
  total: number
  pendingCount: number
  page: number
  pageSize: number
  profile: { id: string; name: string; category: string }
}

export function useReviews() {
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [page, setPage] = useState(1)

  const { data, error, isLoading, mutate } = useSWR<ReviewsData>(
    `/api/reviews?filter=${filter}&page=${page}`,
    fetcher,
  )

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1

  function changeFilter(f: ReviewFilter) {
    setFilter(f)
    setPage(1)
  }

  function changePage(p: number) {
    setPage(p)
  }

  return {
    data,
    error,
    isLoading,
    mutate,
    filter,
    page,
    totalPages,
    changeFilter,
    changePage,
  }
}
