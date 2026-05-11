import useSWR from 'swr'
import { useState } from 'react'
import { fetcher } from '@/lib/swr/fetcher'
import type { ChecklistItem } from '@/lib/gmb/checklist'

interface ChecklistData {
  items: ChecklistItem[]
  currentScore: number
  projectedScore: number
  doneCount: number
  totalCount: number
}

export function useChecklist() {
  const { data, error, isLoading, mutate } = useSWR<ChecklistData>('/api/checklist', fetcher)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  async function toggleDone(item: ChecklistItem) {
    if (toggling || !data) return
    setToggling(item.key)

    const newDone = !item.done

    // Optimistic update
    const optimisticData: ChecklistData = {
      ...data,
      items: data.items.map((i) =>
        i.key === item.key
          ? { ...i, done: newDone, done_at: newDone ? new Date().toISOString() : null }
          : i,
      ),
      doneCount: data.doneCount + (newDone ? 1 : -1),
    }
    await mutate(optimisticData, false)

    const res = await fetch(`/api/checklist/${item.key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: newDone }),
    })

    if (!res.ok) {
      // Revert optimistic update
      await mutate()
    }

    setToggling(null)
  }

  const pending = data?.items.filter((i) => !i.done) ?? []
  const done = data?.items.filter((i) => i.done) ?? []
  const progressPct =
    data && data.totalCount > 0 ? Math.round((data.doneCount / data.totalCount) * 100) : 0

  return {
    data,
    error,
    isLoading,
    expanded,
    setExpanded,
    toggling,
    toggleDone,
    pending,
    done,
    progressPct,
  }
}
