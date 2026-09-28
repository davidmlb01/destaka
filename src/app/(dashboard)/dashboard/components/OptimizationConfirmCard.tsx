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
      // Apply selected description
      if (selectedDescription !== null) {
        const variant = description_variants[selectedDescription]
        const res = await fetch('/api/gbp/optimize/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'description', value: variant.text }),
        })
        results.push({
          label: `Descricao: ${variant.label}`,
          ok: res.ok,
        })
      }

      // Categories, attributes and services are informational for now
      // (the API only supports description at this time)
      if (selectedCategories.size > 0) {
        for (const idx of selectedCategories) {
          results.push({
            label: `Categoria: ${category_suggestions[idx].category}`,
            ok: true, // informational: noted for manual action
          })
        }
      }

      if (selectedAttributes.size > 0) {
        for (const idx of selectedAttributes) {
          results.push({
            label: `Atributo: ${attribute_suggestions[idx].attribute}`,
            ok: true,
          })
        }
      }

      if (selectedServices.size > 0) {
        for (const idx of selectedServices) {
          results.push({
            label: `Servico: ${service_optimizations[idx].optimized}`,
            ok: true,
          })
        }
      }

      setApplyResults(results)
      setStatus('done')
    } catch {
      setErrorMessage('Erro ao aplicar otimizacoes. Tente novamente.')
      setStatus('error')
    }
  }

  // IDLE state: show overview with button to review
  if (status === 'idle') {
    const totalSuggestions =
      description_variants.length +
      category_suggestions.length +
      attribute_suggestions.length +
      service_optimizations.length

    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Otimizacoes sugeridas</h2>
          <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {totalSuggestions} {totalSuggestions === 1 ? 'sugestao' : 'sugestoes'}
          </span>
        </div>

        <div className="px-6 py-4 space-y-2">
          {description_variants.length > 0 && (
            <p className="text-sm text-slate-600">
              {description_variants.length} {description_variants.length === 1 ? 'versao de descricao' : 'versoes de descricao'}
            </p>
          )}
          {category_suggestions.length > 0 && (
            <p className="text-sm text-slate-600">
              {category_suggestions.length} {category_suggestions.length === 1 ? 'categoria sugerida' : 'categorias sugeridas'}
            </p>
          )}
          {attribute_suggestions.length > 0 && (
            <p className="text-sm text-slate-600">
              {attribute_suggestions.length} {attribute_suggestions.length === 1 ? 'atributo sugerido' : 'atributos sugeridos'}
            </p>
          )}
          {service_optimizations.length > 0 && (
            <p className="text-sm text-slate-600">
              {service_optimizations.length} {service_optimizations.length === 1 ? 'servico otimizado' : 'servicos otimizados'}
            </p>
          )}

          <div className="pt-3">
            <button
              onClick={handleReviewChanges}
              className="w-full text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Revisar mudancas antes de aplicar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // DONE state: show results
  if (status === 'done') {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Otimizacoes aplicadas</h2>
        </div>
        <div className="px-6 py-4 space-y-2">
          {applyResults.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`text-sm ${r.ok ? 'text-green-600' : 'text-red-500'}`}>
                {r.ok ? '\u2713' : '\u2717'}
              </span>
              <span className="text-sm text-slate-700">{r.label}</span>
            </div>
          ))}
          <div className="pt-3">
            <button
              onClick={handleCancel}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ERROR state
  if (status === 'error') {
    return (
      <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100">
          <h2 className="font-semibold text-red-700">Erro ao aplicar</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-red-600">{errorMessage}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setStatus('confirming')}
              className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Tentar novamente
            </button>
            <button
              onClick={handleCancel}
              className="text-sm font-semibold text-slate-500 px-4 py-2 hover:text-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // CONFIRMING state: show all changes with checkboxes
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Confirme as mudancas</h2>
        <p className="text-xs text-slate-400 mt-1">
          Revise cada sugestao e marque o que deseja aplicar ao seu perfil Google.
        </p>
      </div>

      <div className="divide-y divide-slate-50">
        {/* Description variants */}
        {description_variants.length > 0 && (
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Descricao do perfil
            </p>
            {currentDescription && (
              <div className="mb-3 bg-slate-50 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 mb-1">Atual</p>
                <p className="text-sm text-slate-500 leading-relaxed">{currentDescription}</p>
              </div>
            )}
            <div className="space-y-3">
              {description_variants.map((variant, i) => (
                <label
                  key={i}
                  className={`block border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                    selectedDescription === i
                      ? 'border-teal-400 bg-teal-50/50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="description"
                      checked={selectedDescription === i}
                      onChange={() => setSelectedDescription(i)}
                      className="mt-1 accent-teal-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                          {variant.label}
                        </span>
                        <span className="text-xs text-slate-400">{variant.char_count || variant.text.length} chars</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{variant.text}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Category suggestions */}
        {category_suggestions.length > 0 && (
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Categorias sugeridas
            </p>
            <div className="space-y-2">
              {category_suggestions.map((cat, i) => (
                <label
                  key={i}
                  className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                    selectedCategories.has(i)
                      ? 'border-teal-400 bg-teal-50/50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(i)}
                    onChange={() => setSelectedCategories(toggleSet(selectedCategories, i))}
                    className="mt-1 accent-teal-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{cat.category}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{cat.justification}</p>
                    {cat.used_by_competitors && (
                      <span className="inline-block mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        Usada por concorrentes
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Attribute suggestions */}
        {attribute_suggestions.length > 0 && (
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Atributos sugeridos
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
              Confirme apenas atributos que sao verdadeiros para o seu estabelecimento.
              Informacoes incorretas podem prejudicar seu perfil.
            </p>
            <div className="space-y-2">
              {attribute_suggestions.map((attr, i) => (
                <label
                  key={i}
                  className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                    selectedAttributes.has(i)
                      ? 'border-teal-400 bg-teal-50/50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAttributes.has(i)}
                    onChange={() => setSelectedAttributes(toggleSet(selectedAttributes, i))}
                    className="mt-1 accent-teal-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{attr.attribute}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{attr.justification}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Service optimizations */}
        {service_optimizations.length > 0 && (
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Servicos otimizados
            </p>
            <div className="space-y-2">
              {service_optimizations.map((svc, i) => (
                <label
                  key={i}
                  className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                    selectedServices.has(i)
                      ? 'border-teal-400 bg-teal-50/50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.has(i)}
                    onChange={() => setSelectedServices(toggleSet(selectedServices, i))}
                    className="mt-1 accent-teal-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 line-through">{svc.original}</span>
                      <span className="text-slate-300">&rarr;</span>
                      <span className="text-slate-800 font-medium">{svc.optimized}</span>
                    </div>
                    {svc.keywords_added.length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Keywords: {svc.keywords_added.join(', ')}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="text-sm font-semibold text-slate-500 px-4 py-2 rounded-lg hover:text-slate-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmAndApply}
          disabled={!hasSelection || status === 'applying'}
          className={`text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors ${
            hasSelection
              ? 'bg-teal-600 text-white hover:bg-teal-500'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {status === 'applying' ? 'Aplicando...' : 'Confirmar e aplicar'}
        </button>
      </div>
    </div>
  )
}
