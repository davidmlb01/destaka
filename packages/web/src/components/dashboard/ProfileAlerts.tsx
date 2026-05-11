'use client'

import { useEffect, useState, useCallback } from 'react'

interface Alert {
  id: string
  field: string
  old_value: string | null
  new_value: string | null
  acknowledged: boolean
  created_at: string
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome do perfil',
  phone: 'Telefone',
  address: 'Endereço',
  categories: 'Categoria principal',
  websiteUri: 'Site',
  regularHours: 'Horário de funcionamento',
}

export function ProfileAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const loadAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/alerts')
      if (!res.ok) return
      const data = await res.json() as { alerts: Alert[] }
      setAlerts(data.alerts)
    } catch {
      // silencioso: não bloquear o dashboard
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const acknowledge = useCallback(async (alertId: string) => {
    await fetch('/api/profile/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId }),
    })
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }, [])

  if (loading || alerts.length === 0) return null

  return (
    <div className="flex flex-col gap-3 mb-6">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="rounded-2xl px-5 py-4"
          style={{
            background: 'rgba(251,146,60,0.08)',
            border: '1px solid rgba(251,146,60,0.25)',
          }}
        >
          <div className="flex items-start gap-3">
            <span style={{ fontSize: 20, lineHeight: 1 }}>⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white mb-1">
                Alteração detectada: {FIELD_LABELS[alert.field] ?? alert.field}
              </p>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                {alert.old_value
                  ? `Valor anterior: "${truncate(alert.old_value, 80)}" → Novo valor: "${truncate(alert.new_value ?? '(vazio)', 80)}"`
                  : `Novo valor definido: "${truncate(alert.new_value ?? '(vazio)', 80)}"`
                }
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => acknowledge(alert.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: 'rgba(74,222,128,0.15)',
                    border: '1px solid rgba(74,222,128,0.25)',
                    color: '#4ADE80',
                  }}
                >
                  OK, eu autorizei
                </button>
                <button
                  onClick={() => acknowledge(alert.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#EF4444',
                  }}
                >
                  Não fui eu
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}
