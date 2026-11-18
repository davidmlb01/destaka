import useSWR from 'swr'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetcher } from '@/lib/swr/fetcher'
import { apiFetch } from '@/lib/api/client'

interface Post {
  id: string
  content: string
  type: string
  status: 'draft' | 'pending' | 'published' | 'scheduled' | 'failed'
  scheduled_at: string | null
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
  const [justPublishedId, setJustPublishedId] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const { error } = await apiFetch('/api/posts/generate', { method: 'POST' })
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Post gerado com sucesso!')
      await mutate()
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish(postId: string, editedContent?: string) {
    setPublishingId(postId)
    try {
      const { error } = await apiFetch(`/api/posts/${postId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: editedContent ? JSON.stringify({ content: editedContent }) : undefined,
      })
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Post publicado no Google!')
      setJustPublishedId(postId)
      await mutate()
      setTimeout(() => setJustPublishedId(null), 4000)
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
      toast.success('Post descartado.')
      await mutate()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleModeChange(mode: 'automatic' | 'approval') {
    if (!data || mode === data.autoPostMode) return
    setSavingMode(true)
    try {
      const { error } = await apiFetch('/api/posts/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPostMode: mode }),
      })
      if (error) {
        toast.error(error)
      } else {
        await mutate({ ...data, autoPostMode: mode }, false)
        toast.success('Modo de postagem atualizado.')
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
    justPublishedId,
    handleGenerate,
    handlePublish,
    handleDiscard,
    handleModeChange,
  }
}
