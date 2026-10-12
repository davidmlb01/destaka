'use client'

import { useState } from 'react'

interface RetriggerButtonProps {
  orgId: string
  orgName: string
}

export function RetriggerButton({ orgId, orgName }: RetriggerButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRetrigger() {
    if (loading || done) return
    setLoading(true)

    try {
      const res = await fetch('/api/admin/retrigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin-from-ui',
        },
        body: JSON.stringify({ organization_id: orgId }),
      })

      if (res.ok) {
        setDone(true)
        setTimeout(() => setDone(false), 3000)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRetrigger}
      disabled={loading}
      title={`Recalcular ${orgName}`}
      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:cursor-wait"
      style={{
        background: done ? 'var(--success-bg)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${done ? 'var(--success-border)' : 'var(--border-card)'}`,
      }}
    >
      {loading ? (
        <div
          className="w-3.5 h-3.5 rounded-full animate-spin"
          style={{ border: '2px solid var(--text-muted)', borderTopColor: 'var(--text-secondary)' }}
        />
      ) : done ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      )}
    </button>
  )
}
