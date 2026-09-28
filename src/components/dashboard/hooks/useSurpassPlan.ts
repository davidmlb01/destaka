import useSWR from 'swr'
import { useState } from 'react'
import { fetcher } from '@/lib/swr/fetcher'

interface PlanStep {
  id: string
  week: number
  title: string
  description: string
  mode: 'auto' | 'manual'
  impact: number
  score_component: string
  status: 'pending' | 'active' | 'done' | 'skipped'
  completed_at: string | null
  action_type: string | null
}

interface SurpassPlanData {
  plan: {
    id: string
    current_score: number
    competitor_max_score: number | null
    target_score: number
    status: 'active' | 'completed' | 'expired'
    progress: {
      total_steps: number
      completed_steps: number
      percentage: number
      points_gained: number
      points_remaining: number
    }
    steps: PlanStep[]
    created_at: string
    expires_at: string
    days_remaining: number
  } | null
}

export function useSurpassPlan() {
  const { data, error, isLoading, mutate } = useSWR<SurpassPlanData>(
    '/api/plan/surpass',
    fetcher,
    { revalidateOnFocus: false }
  )
  const [generating, setGenerating] = useState(false)

  async function generatePlan() {
    setGenerating(true)
    try {
      const res = await fetch('/api/plan/surpass', { method: 'POST' })
      if (res.ok) await mutate()
    } finally {
      setGenerating(false)
    }
  }

  return {
    plan: data?.plan ?? null,
    error,
    isLoading,
    generating,
    generatePlan,
    mutate,
  }
}
