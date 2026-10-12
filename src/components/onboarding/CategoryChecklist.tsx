'use client'

import { useState, useEffect } from 'react'

interface SuggestedCategory {
  displayName: string
  name: string
  reason: string
}

interface CategoryChecklistProps {
  onComplete: () => void
  onSkip: () => void
}

export default function CategoryChecklist({ onComplete, onSkip }: CategoryChecklistProps) {
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<string[]>([])
  const [suggested, setSuggested] = useState<SuggestedCategory[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/onboarding/suggested-categories')
        if (!res.ok) throw new Error('Falha ao carregar categorias')
        const data = await res.json()
        setCurrent(data.current ?? [])
        setSuggested(data.suggested ?? [])
        // Pre-selecionar todas as sugeridas
        setSelected(new Set((data.suggested ?? []).map((s: SuggestedCategory) => s.name)))
      } catch {
        // Se falhar, nao bloquear o onboarding
        setSuggested([])
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  function toggleCategory(name: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  async function handleApply() {
    if (selected.size === 0) {
      onSkip()
      return
    }

    setSaving(true)
    setError('')

    try {
      const selectedCategories = suggested
        .filter(s => selected.has(s.name))
        .map(s => ({ displayName: s.displayName, name: s.name }))

      const res = await fetch('/api/onboarding/suggested-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: selectedCategories }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Falha ao aplicar categorias')
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)' }}
        />
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Analisando categorias do seu perfil...
        </p>
      </div>
    )
  }

  if (suggested.length === 0) {
    // Nenhuma sugestao, pular silenciosamente
    onSkip()
    return null
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-white mb-1">
        Categorias recomendadas
      </h1>
      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Encontramos categorias que seus concorrentes usam e podem melhorar sua visibilidade.
      </p>

      {current.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Suas categorias atuais
          </p>
          <div className="flex flex-wrap gap-1.5">
            {current.map(cat => (
              <span
                key={cat}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--accent)' }}>
          Sugestoes baseadas nos concorrentes
        </p>
        <div className="space-y-2">
          {suggested.map(cat => (
            <button
              key={cat.name}
              type="button"
              onClick={() => toggleCategory(cat.name)}
              className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer"
              style={{
                background: selected.has(cat.name)
                  ? 'rgba(20,184,166,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selected.has(cat.name) ? 'rgba(20,184,166,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div
                className="shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors"
                style={{
                  background: selected.has(cat.name) ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${selected.has(cat.name) ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                }}
              >
                {selected.has(cat.name) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: selected.has(cat.name) ? 'var(--accent-bright)' : '#fff' }}>
                  {cat.displayName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {cat.reason}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p
          className="text-sm mb-4 p-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="rounded-xl px-5 py-3.5 font-medium transition-colors cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Pular
        </button>
        <button
          onClick={handleApply}
          disabled={saving}
          className="flex-1 rounded-xl px-6 py-3.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {saving ? 'Aplicando...' : `Aplicar ${selected.size} ${selected.size === 1 ? 'categoria' : 'categorias'}`}
        </button>
      </div>
    </div>
  )
}
