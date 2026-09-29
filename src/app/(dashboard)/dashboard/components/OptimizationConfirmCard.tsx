'use client'

import { useState } from 'react'

interface DescriptionVariant {
  focus: 'seo' | 'conversao' | 'confianca'
  label: string
  text: string
  char_count: number
}

interface CategorySuggestion {
  category: string
  justification: string
  used_by_competitors: boolean
}

interface AttributeSuggestion {
  attribute: string
  justification: string
}

interface ServiceOptimization {
  original: string
  optimized: string
  keywords_added: string[]
}

interface OptimizationReport {
  generated_at: string
  category_suggestions: CategorySuggestion[]
  attribute_suggestions: AttributeSuggestion[]
  description_variants: DescriptionVariant[]
  service_optimizations: ServiceOptimization[]
  photo_naming: {
    convention: string
    examples: string[]
  }
  priority_order: string[]
}

type ApplyStatus = 'idle' | 'confirming' | 'applying' | 'done' | 'error'

const FOCUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  seo: { label: 'Focada em palavras-chave', color: '#14B8A6', bg: 'rgba(20,184,166,0.15)' },
  conversao: { label: 'Focada em conversão', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  confianca: { label: 'Focada em credibilidade', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
}

export function OptimizationConfirmCard({
  optimizationReport,
  currentDescription,
}: {
  optimizationReport: OptimizationReport | null
  currentDescription: string | null
}) {
  const [status, setStatus] = useState<ApplyStatus>('idle')
  const [selectedDescription, setSelectedDescription] = useState<number | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set())
  const [selectedAttributes, setSelectedAttributes] = useState<Set<number>>(new Set())
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set())
  const [applyResults, setApplyResults] = useState<Array<{ label: string; ok: boolean }>>([])
  const [errorMessage, setErrorMessage] = useState('')

  if (!optimizationReport) return null

  const {
    description_variants,
    category_suggestions,
    attribute_suggestions,
    service_optimizations,
  } = optimizationReport

  const hasAnySuggestion =
    description_variants.length > 0 ||
    category_suggestions.length > 0 ||
    attribute_suggestions.length > 0 ||
    service_optimizations.length > 0

  if (!hasAnySuggestion) return null

  const hasSelection =
    selectedDescription !== null ||
    selectedCategories.size > 0 ||
    selectedAttributes.size > 0 ||
    selectedServices.size > 0

  function toggleSet(set: Set<number>, index: number): Set<number> {
    const next = new Set(set)
    if (next.has(index)) {
      next.delete(index)
    } else {
      next.add(index)
    }
    return next
  }

  function handleReviewChanges() {
    setStatus('confirming')
  }

  function handleCancel() {
    setStatus('idle')
    setSelectedDescription(null)
    setSelectedCategories(new Set())
    setSelectedAttributes(new Set())
    setSelectedServices(new Set())
    setApplyResults([])
    setErrorMessage('')
  }

  async function handleConfirmAndApply() {
    setStatus('applying')
    setApplyResults([])
    setErrorMessage('')

    const results: Array<{ label: string; ok: boolean }> = []

    try {
      if (selectedDescription !== null) {
        const variant = description_variants[selectedDescription]
        const res = await fetch('/api/gbp/optimize/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'description', value: variant.text }),
        })
        results.push({ label: `Descrição: ${variant.label}`, ok: res.ok })
      }

      if (selectedCategories.size > 0) {
        const additionalCategories = Array.from(selectedCategories).map(idx => ({
          displayName: category_suggestions[idx].category,
          name: category_suggestions[idx].category,
        }))
        const res = await fetch('/api/gbp/optimize/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'categories', value: { additionalCategories } }),
        })
        for (const idx of selectedCategories) {
          results.push({ label: `Categoria: ${category_suggestions[idx].category}`, ok: res.ok })
        }
      }

      if (selectedAttributes.size > 0) {
        const attributes = Array.from(selectedAttributes).map(idx => ({
          name: attribute_suggestions[idx].attribute,
          valueType: 'BOOL',
          values: ['true'],
        }))
        const res = await fetch('/api/gbp/optimize/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'attributes', value: attributes }),
        })
        for (const idx of selectedAttributes) {
          results.push({ label: `Atributo: ${attribute_suggestions[idx].attribute}`, ok: res.ok })
        }
      }

      if (selectedServices.size > 0) {
        const services = Array.from(selectedServices).map(idx => ({
          freeFormServiceItem: {
            category: 'service',
            label: { displayName: service_optimizations[idx].optimized, description: '' },
          },
        }))
        const res = await fetch('/api/gbp/optimize/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'services', value: services }),
        })
        for (const idx of selectedServices) {
          results.push({ label: `Serviço: ${service_optimizations[idx].optimized}`, ok: res.ok })
        }
      }

      setApplyResults(results)
      setStatus('done')
    } catch {
      setErrorMessage('Não foi possível aplicar as mudanças. Tente novamente.')
      setStatus('error')
    }
  }

  // IDLE
  if (status === 'idle') {
    const totalSuggestions =
      description_variants.length +
      category_suggestions.length +
      attribute_suggestions.length +
      service_optimizations.length

    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-display font-bold text-white text-sm">Melhorias encontradas</h2>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(20,184,166,0.15)', color: '#14B8A6' }}
          >
            {totalSuggestions} {totalSuggestions === 1 ? 'sugestão' : 'sugestões'}
          </span>
        </div>

        <div className="px-5 py-4 space-y-1.5">
          {description_variants.length > 0 && (
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {description_variants.length} {description_variants.length === 1 ? 'versão de descrição' : 'versões de descrição'}
            </p>
          )}
          {category_suggestions.length > 0 && (
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {category_suggestions.length} {category_suggestions.length === 1 ? 'categoria sugerida' : 'categorias sugeridas'}
            </p>
          )}
          {attribute_suggestions.length > 0 && (
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {attribute_suggestions.length} {attribute_suggestions.length === 1 ? 'atributo sugerido' : 'atributos sugeridos'}
            </p>
          )}
          {service_optimizations.length > 0 && (
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {service_optimizations.length} {service_optimizations.length === 1 ? 'serviço otimizado' : 'serviços otimizados'}
            </p>
          )}

          <div className="pt-3">
            <button
              onClick={handleReviewChanges}
              className="w-full text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
              style={{
                background: 'rgba(20,184,166,0.15)',
                border: '1px solid rgba(20,184,166,0.25)',
                color: '#14B8A6',
              }}
            >
              Revisar antes de aplicar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // DONE
  if (status === 'done') {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(74,222,128,0.1)' }}>
          <h2 className="font-display font-bold text-white text-sm">Mudanças aplicadas</h2>
        </div>
        <div className="px-5 py-4 space-y-2">
          {applyResults.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm" style={{ color: r.ok ? '#4ADE80' : '#F87171' }}>
                {r.ok ? '\u2713' : '\u2717'}
              </span>
              <span className="text-[13px]" style={{ color: r.ok ? 'var(--text-secondary)' : '#F87171' }}>{r.label}</span>
            </div>
          ))}
          <div className="pt-2">
            <button
              onClick={handleCancel}
              className="text-xs font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ERROR
  if (status === 'error') {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(248,113,113,0.1)' }}>
          <h2 className="font-display font-bold text-white text-sm">Não foi possível aplicar</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-[13px]" style={{ color: '#FCA5A5' }}>{errorMessage}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setStatus('confirming')}
              className="text-sm font-bold px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}
            >
              Tentar novamente
            </button>
            <button
              onClick={handleCancel}
              className="text-sm font-medium px-4 py-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // CONFIRMING
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="font-display font-bold text-white text-sm">Confirme as mudanças</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Revise cada sugestão e marque o que deseja aplicar ao seu perfil.
        </p>
      </div>

      {/* Description variants */}
      {description_variants.length > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
            Descrição do perfil
          </p>
          {currentDescription && (
            <div
              className="mb-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <p className="text-[10px] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Atual</p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{currentDescription}</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {description_variants.map((variant, i) => {
              const focusCfg = FOCUS_LABELS[variant.focus] ?? FOCUS_LABELS.seo
              return (
                <label
                  key={i}
                  className="block rounded-xl px-4 py-3 cursor-pointer transition-all"
                  style={{
                    background: selectedDescription === i ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)',
                    border: selectedDescription === i ? '1px solid rgba(20,184,166,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="description"
                      checked={selectedDescription === i}
                      onChange={() => setSelectedDescription(i)}
                      className="mt-1 accent-teal-500"
                      style={{ accentColor: '#14B8A6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ background: focusCfg.bg, color: focusCfg.color }}
                        >
                          {focusCfg.label}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {variant.char_count || variant.text.length} chars
                        </span>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{variant.text}</p>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Categories */}
      {category_suggestions.length > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
            Categorias sugeridas
          </p>
          <div className="flex flex-col gap-2">
            {category_suggestions.map((cat, i) => (
              <label
                key={i}
                className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                style={{
                  background: selectedCategories.has(i) ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)',
                  border: selectedCategories.has(i) ? '1px solid rgba(20,184,166,0.25)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.has(i)}
                  onChange={() => setSelectedCategories(toggleSet(selectedCategories, i))}
                  className="mt-1"
                  style={{ accentColor: '#14B8A6' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white">{cat.category}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{cat.justification}</p>
                  {cat.used_by_competitors && (
                    <span
                      className="inline-block mt-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(168,85,247,0.15)', color: '#C084FC' }}
                    >
                      Usada pelos concorrentes
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Attributes */}
      {attribute_suggestions.length > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
            Atributos sugeridos
          </p>
          <div
            className="rounded-xl px-3 py-2 mb-3 text-[11px]"
            style={{ background: 'rgba(251,191,36,0.08)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.15)' }}
          >
            Confirme apenas atributos verdadeiros para o seu estabelecimento.
          </div>
          <div className="flex flex-col gap-2">
            {attribute_suggestions.map((attr, i) => (
              <label
                key={i}
                className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                style={{
                  background: selectedAttributes.has(i) ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)',
                  border: selectedAttributes.has(i) ? '1px solid rgba(20,184,166,0.25)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedAttributes.has(i)}
                  onChange={() => setSelectedAttributes(toggleSet(selectedAttributes, i))}
                  className="mt-1"
                  style={{ accentColor: '#14B8A6' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white">{attr.attribute}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{attr.justification}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {service_optimizations.length > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
            Serviços otimizados
          </p>
          <div className="flex flex-col gap-2">
            {service_optimizations.map((svc, i) => (
              <label
                key={i}
                className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                style={{
                  background: selectedServices.has(i) ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)',
                  border: selectedServices.has(i) ? '1px solid rgba(20,184,166,0.25)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedServices.has(i)}
                  onChange={() => setSelectedServices(toggleSet(selectedServices, i))}
                  className="mt-1"
                  style={{ accentColor: '#14B8A6' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[13px]">
                    <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{svc.original}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{'\u2192'}</span>
                    <span className="font-medium text-white">{svc.optimized}</span>
                  </div>
                  {svc.keywords_added.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {svc.keywords_added.map((kw, j) => (
                        <span
                          key={j}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(20,184,166,0.1)', color: '#14B8A6' }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="text-sm font-medium px-4 py-2 rounded-xl"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmAndApply}
          disabled={!hasSelection || status === 'applying'}
          className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
          style={{
            background: hasSelection ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.04)',
            border: hasSelection ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(255,255,255,0.06)',
            color: hasSelection ? '#14B8A6' : 'var(--text-muted)',
            cursor: hasSelection ? 'pointer' : 'not-allowed',
          }}
        >
          {status === 'applying' ? 'Aplicando...' : 'Confirmar e aplicar'}
        </button>
      </div>
    </div>
  )
}
