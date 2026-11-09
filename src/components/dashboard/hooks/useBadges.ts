import useSWR from 'swr'
import { fetcher } from '@/lib/swr/fetcher'

interface BadgeCounts {
  posts: number
  reviews: number
  optimizations: number
}

export function useBadges() {
  const { data } = useSWR<BadgeCounts>('/api/dashboard/badges', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30000,
  })

  return {
    posts: data?.posts ?? 0,
    reviews: data?.reviews ?? 0,
    optimizations: data?.optimizations ?? 0,
  }
}
