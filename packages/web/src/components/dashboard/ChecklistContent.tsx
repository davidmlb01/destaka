'use client'

import { useEffect, useState } from 'react'
import type { ChecklistItem } from '@/lib/gmb/checklist'
import { ChecklistSkeleton } from './Skeletons'

interface ChecklistData {
  items: ChecklistItem[]
  currentScore: number
  projectedScore: number
  doneCount: number
  totalCount: number
}

const PRIORITY_LABELS: Record<string, string> = {
  P0: 'Urgente',
  P1: 'Importante',
  P2: 'Opcional',
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#FB923C',
  P1: '#FBBF24',
  P2: 'rgba(255,255,255,0.3)',
}

const CATEGORY_ICONS: Record<string, string> = {
  photos: '📸',
  reviews: '⭐',
  verification: '✅',
  info: '📋',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function ChecklistContent() {
  const [data, setData] = useState<ChecklistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/checklist')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleDone(item: ChecklistItem) {
    if (toggling) return
    setToggling(item.key)

    const newDone = !item.done

    // Optimistic update
    setData(d => d ? {
      ...d,
      items: d.items.map(i => i.key === item.key ? { ...i, done: newDone, done_at: newDone ? new Date().toISOString() : null } : i),
      doneCount: d.doneCount + (newDone ? 1 : -1),
    } : d)

    const res = await fetch(`/api/checklist/${item.key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: newDone }),
    })

    if (!res.ok) {
      // Reverte o optimistic update em caso de erro
      setData(d => d ? {
        ...d,
        items: d.items.map(i => i.key === item.key ? { ...i, done: item.done, done_at: item.done_at ?? null } : i),
        doneCount: d.doneCount + (newDone ? -1 : 1),
      } : d)
    }

    setToggling(null)
  }

  if (loading) {
    return <ChecklistSkeleton />
  }

  if (!data) return null

  const pending = data.items.filter(i => !i.done)
  const done = data.items.filter(i => i.done)
  const progressPct = data.totalCount > 0 ? Math.round((data.doneCount / data.totalCount) * 100) : 0

  return (
    <div className="flex flex-col gap-6">

      {/* Progresso geral */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-display font-bold text-white text-sm">
              {data.doneCount} de {data.totalCount} tarefas concluídas
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Concluir tudo pode levar seu score de {data.currentScore} para {data.projectedScore} pontos
            </p>
          </div>
          <span className="font-display font-extrabold" style={{ fontSize: 28, color: '#4ADE80' }}>
            {progressPct}%
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: 'var(--success)' }}
          />
        </div>
      </div>

      {/* Tarefas pendentes */}
      {pending.length > 0 && (
        <div>
          <p className="font-display font-bold text-white text-sm mb-3" style={{ opacity: 0.7 }}>
            Pendentes ({pending.length})
          </p>
          <div className="flex flex-col gap-3">
            {pending.map(item => (
              <ChecklistCard
                key={item.key}
                item={item}
                expanded={expanded === item.key}
                toggling={toggling === item.key}
                onToggle={() => setExpanded(expanded === item.key ? null : item.key)}
                onMarkDone={() => toggleDone(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tarefas concluídas */}
      {done.length > 0 && (
        <div>
          <p className="font-display font-bold text-white text-sm mb-3" style={{ opacity: 0.5 }}>
            Concluídas ({done.length})
          </p>
          <div className="flex flex-col gap-2">
            {done.map(item => (
              <div
                key={item.key}
                className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
                style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.1)' }}
              >
                <button
                  onClick={() => toggleDone(item)}
                  disabled={toggling === item.key}
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                  style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)' }}
                >
                  <span style={{ color: '#4ADE80', fontSize: 12 }}>✓</span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-through" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {item.title}
                  </p>
                </div>
                {item.done_at && (
                  <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {formatDate(item.done_at)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && done.length > 0 && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}
        >
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-display font-bold text-white mb-1">Checklist completo!</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Seu perfil está totalmente otimizado nas ações manuais.
          </p>
        </div>
      )}
    </div>
  )
}

function ChecklistCard({
  item,
  expanded,
  toggling,
  onToggle,
  onMarkDone,
}: {
  item: ChecklistItem
  expanded: boolean
  toggling: boolean
  onToggle: () => void
  onMarkDone: () => void
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: `1px solid ${item.priority === 'P0' ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {/* Header do card */}
      <div className="flex items-start gap-3 p-5">
        {/* Checkbox */}
        <button
          onClick={onMarkDone}
          disabled={toggling}
          className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all"
          style={{
            background: 'transparent',
            border: '2px solid rgba(255,255,255,0.2)',
          }}
          aria-label="Marcar como feito"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[item.category]}</span>
            <span className="font-medium text-white text-sm">{item.title}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: `${PRIORITY_COLORS[item.priority]}18`,
                color: PRIORITY_COLORS[item.priority],
              }}
            >
              {PRIORITY_LABELS[item.priority]}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            {item.description}
          </p>
        </div>

        {/* Impacto + toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold" style={{ color: '#4ADE80' }}>+{item.impact}pts</span>
          <button
            onClick={onToggle}
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.3)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            ▼
          </button>
        </div>
      </div>

      {/* Steps expandidos */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-4">
            <p className="text-xs font-bold mb-3" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Passo a passo
            </p>
            <ol className="flex flex-col gap-2.5">
              {item.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                    {step}
                  </p>
                </li>
              ))}
            </ol>
            <button
              onClick={onMarkDone}
              disabled={toggling}
              className="mt-4 w-full rounded-xl py-2.5 text-sm font-bold"
              style={{
                background: 'rgba(74,222,128,0.12)',
                border: '1px solid rgba(74,222,128,0.2)',
                color: '#4ADE80',
              }}
            >
              Marcar como feito
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
