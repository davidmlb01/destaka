'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface PopulateTriggerProps {
  orgName: string
  hasScore: boolean
  hasProfile: boolean
}

export function PopulateTrigger({ orgName, hasScore, hasProfile }: PopulateTriggerProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [autoTriggered, setAutoTriggered] = useState(false)

  const needsPopulate = !hasScore && !hasProfile

  const populate = useCallback(async () => {
    if (status === 'loading') return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/dashboard/populate', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? 'Erro ao carregar dados do perfil')
        return
      }

      setStatus('success')
      // Recarrega a pagina para mostrar os dados populados
      router.refresh()
    } catch {
      setStatus('error')
      setErrorMsg('Falha na conexao. Tente novamente.')
    }
  }, [status, router])

  // Auto-trigger na primeira visita se nao tem dados
  useEffect(() => {
    if (needsPopulate && !autoTriggered) {
      setAutoTriggered(true)
      populate()
    }
  }, [needsPopulate, autoTriggered, populate])

  // Se ja tem dados, nao mostra nada
  if (!needsPopulate && status !== 'loading') return null

  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      {status === 'loading' && (
        <div className="space-y-3">
          <div className="flex justify-center">
            <div
              className="h-8 w-8 rounded-full border-2 animate-spin"
              style={{
                borderColor: 'var(--border-subtle)',
                borderTopColor: 'var(--accent)',
              }}
            />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Buscando dados de &quot;{orgName}&quot; no Google Maps...
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Isso leva alguns segundos
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-red-400">{errorMsg}</p>
          <button
            onClick={populate}
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{
              background: 'var(--accent)',
              color: 'var(--text-on-accent, #fff)',
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {status === 'idle' && needsPopulate && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Seu dashboard ainda nao tem dados. Clique para buscar as informacoes do seu perfil no Google.
          </p>
          <button
            onClick={populate}
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{
              background: 'var(--accent)',
              color: 'var(--text-on-accent, #fff)',
            }}
          >
            Iniciar auditoria
          </button>
        </div>
      )}

      {status === 'success' && (
        <p className="text-sm font-medium text-green-400">
          Dados carregados com sucesso. Atualizando...
        </p>
      )}
    </div>
  )
}
