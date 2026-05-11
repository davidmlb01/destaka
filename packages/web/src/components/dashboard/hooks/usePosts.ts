import useSWR from 'swr'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetcher } from '@/lib/swr/fetcher'
import { apiFetch } from '@/lib/api/client'

interface Post {
  id: string
  content: string
  type: string
  status: 'draft' | 'published' | 'scheduled' | 'failed'
  scheduled_for: string | null
  published_at: string | null
  created_at: string
}

interface PostsData {
  posts: Post[]
  total: number
  page: number
  pageSize: number
  scheduledNext: Post | null
  autoPostMode: 'automatic' | 'approval'
  profile: { id: string; name: string; category: string }
}

export function usePosts() {
  const { data, error, isLoading, mutate } = useSWR<PostsData>('/api/posts', fetcher)
  const [generating, setGenerating] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingMode, setSavingMode] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const { error } = await apiFetch('/api/posts/generate', { method: 'POST' })
      if (error) {
        toast.error(error)
        return
      }
      await mutate()
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish(postId: string) {
    setPublishingId(postId)
    try {
      const { error } = await apiFetch(`/api/posts/${postId}/publish`, { method: 'POST' })
      if (error) {
        toast.error(error)
        return
      }
      await mutate()
    } finally {
      setPublishingId(null)
    }
  }

  async function handleDiscard(postId: string) {
    setDeletingId(postId)
    try {
      const { error } = await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (error) {
        toast.error(error)
        return
      }
      await mutate()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleModeChange(mode: 'automatic' | 'approval') {
    if (!data || mode === data.autoPostMode) return
    setSavingMode(true)
    try {
      const res = await fetch('/api/posts/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPostMode: mode }),
      })
      if (res.ok) {
        await mutate({ ...data, autoPostMode: mode }, false)
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(err.error ?? 'Erro ao salvar configuração.')
      }
    } finally {
      setSavingMode(false)
    }
  }

  return {
    data,
    error,
    isLoading,
    generating,
    publishingId,
    deletingId,
    savingMode,
    handleGenerate,
    handlePublish,
    handleDiscard,
    handleModeChange,
  }
}
