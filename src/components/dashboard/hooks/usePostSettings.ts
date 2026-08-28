import { useState } from 'react'
import { toast } from 'sonner'

export function usePostSettings(
  currentMode: 'automatic' | 'approval' | undefined,
  onModeChanged: (mode: 'automatic' | 'approval') => void,
) {
  const [savingMode, setSavingMode] = useState(false)

  async function handleModeChange(mode: 'automatic' | 'approval') {
    if (!currentMode || mode === currentMode) return
    setSavingMode(true)
    try {
      const res = await fetch('/api/posts/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPostMode: mode }),
      })
      if (res.ok) {
        onModeChanged(mode)
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(err.error ?? 'Erro ao salvar configuração.')
      }
    } finally {
      setSavingMode(false)
    }
  }

  return { savingMode, handleModeChange }
}
