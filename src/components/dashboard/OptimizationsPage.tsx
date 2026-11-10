'use client'

import { useState, useCallback } from 'react'

/* ─── Types ─── */

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

interface Props {
  optimizationReport: OptimizationReport | null
  currentDescription: string | null
  currentCategories: string[]
  onboardingServices: string[]
  onboardingDifferentials: string
  automationPreference: string
  currentScore: number | null
}

type SectionStatus = 'idle' | 'applying' | 'done' | 'error'

const FOCUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  seo: { label: 'SEO', color: '#14B8A6', bg: 'rgba(20,184,166,0.15)' },
  conversao: { label: 'Conversão', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  confianca: { label: 'Credibilidade', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
}

/* ─── Helpers ─── */

function estimateScoreBoost(report: OptimizationReport | null): number {
  if (!report) return 0
  let pts = 0
  if (report.description_variants.length > 0) pts += 4
  if (report.category_suggestions.length > 0) pts += 2
  if (report.attribute_suggestions.length > 0) pts += Math.min(report.attribute_suggestions.length, 3)
  if (report.service_optimizations.length > 0) pts += 2
  return pts
}

/* ─── Component ─── */

export function OptimizationsPage({
  optimizationReport,
  currentDescription,
  currentCategories,
  onboardingServices,
  onboardingDifferentials: _onboardingDifferentials,
  automationPreference: initialAutomation,
  currentScore,
}: Props) {
  // Autopilot
  const [autoPilot, setAutoPilot] = useState(initialAutomation === 'automatico')
  const [autoToggling, setAutoToggling] = useState(false)

  // Description
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [descriptionText, setDescriptionText] = useState('')
  const [descStatus, setDescStatus] = useState<SectionStatus>('idle')

  // Categories
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set())
  const [catStatus, setCatStatus] = useState<SectionStatus>('idle')

  // Attributes
  const [confirmedAttrs, setConfirmedAttrs] = useState<Set<number>>(new Set())
  const [attrStatus, setAttrStatus] = useState<SectionStatus>('idle')

  // Services
  const [editedServices, setEditedServices] = useState<Record<number, string>>({})
  const [svcStatus, setSvcStatus] = useState<SectionStatus>('idle')

  // Applied items collapsed
  const [appliedOpen, setAppliedOpen] = useState(false)

  const report = optimizationReport
  const descVariants = report?.description_variants ?? []
  const catSuggestions = report?.category_suggestions ?? []
  const attrSuggestions = report?.attribute_suggestions ?? []
  const svcOptimizations = report?.service_optimizations ?? []
  const boost = estimateScoreBoost(report)

  /* ─── Autopilot toggle ─── */
  const handleAutoToggle = useCallback(async () => {
    setAutoToggling(true)
    const newValue = autoPilot ? 'manual' : 'automatico'
    try {
      const res = await fetch('/api/organizations/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automation_preference: newValue }),
      })
      if (res.ok) setAutoPilot(!autoPilot)
    } finally {
      setAutoToggling(false)
    }
  }, [autoPilot])

  /* ─── Apply description ─── */
  const handleApplyDescription = useCallback(async () => {
    if (!descriptionText.trim()) return
    setDescStatus('applying')
    try {
      const res = await fetch('/api/gbp/optimize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'description', value: descriptionText }),
      })
      setDescStatus(res.ok ? 'done' : 'error')
    } catch {
      setDescStatus('error')
    }
  }, [descriptionText])

  /* ─── Apply categories ─── */
  const handleApplyCategories = useCallback(async () => {
    if (selectedCategories.size === 0) return
    setCatStatus('applying')
    try {
      const additionalCategories = Array.from(selectedCategories).map(idx => ({
        displayName: catSuggestions[idx].category,
        name: catSuggestions[idx].category,
      }))
      const res = await fetch('/api/gbp/optimize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'categories', value: { additionalCategories } }),
      })
      setCatStatus(res.ok ? 'done' : 'error')
    } catch {
      setCatStatus('error')
    }
  }, [selectedCategories, catSuggestions])

  /* ─── Apply attributes ─── */
  const handleApplyAttributes = useCallback(async () => {
    if (confirmedAttrs.size === 0) return
    setAttrStatus('applying')
    try {
      const attributes = Array.from(confirmedAttrs).map(idx => ({
        name: attrSuggestions[idx].attribute,
        valueType: 'BOOL',
        values: ['true'],
      }))
      const res = await fetch('/api/gbp/optimize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'attributes', value: attributes }),
      })
      setAttrStatus(res.ok ? 'done' : 'error')
    } catch {
      setAttrStatus('error')
    }
  }, [confirmedAttrs, attrSuggestions])

  /* ─── Apply services ─── */
  const handleApplyServices = useCallback(async () => {
    const entries = svcOptimizations.map((svc, i) => ({
      freeFormServiceItem: {
        category: 'service',
        label: {
          displayName: editedServices[i] ?? svc.optimized,
          description: '',
        },
      },
    }))
    if (entries.length === 0) return
    setSvcStatus('applying')
    try {
      const res = await fetch('/api/gbp/optimize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'services', value: entries }),
      })
      setSvcStatus(res.ok ? 'done' : 'error')
    } catch {
      setSvcStatus('error')
    }
  }, [editedServices, svcOptimizations])

  /* ─── Select variant ─── */
  function handleSelectVariant(idx: number) {
    setSelectedVariant(idx)
    setDescriptionText(descVariants[idx].text)
    setDescStatus('idle')
  }

  function toggleCategory(idx: number) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
    setCatStatus('idle')
  }

  function toggleAttribute(idx: number) {
    setConfirmedAttrs(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
    setAttrStatus('idle')
  }

  const hasNoSuggestions =
    descVariants.length === 0 &&
    catSuggestions.length === 0 &&
    attrSuggestions.length === 0 &&
    svcOptimizations.length === 0

  if (!report || hasNoSuggestions) {
    return (
      <div className="px-6 py-10 max-w-3xl">
        <h1 className="font-display font-bold text-white text-2xl mb-3">Melhorias para seu perfil</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 15 }}>
          Nenhuma sugestão disponível no momento. Execute o diagnóstico para gerar recomendações.
        </p>
      </div>
    )
  }

  return (
    <div className="px-6 py-10 max-w-3xl space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="font-display font-bold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
          Melhorias para seu perfil
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-tertiary)', fontSize: 15, lineHeight: 1.6 }}>
          Cada melhoria sobe você no ranking do Google
        </p>
      </div>

      {/* ── Auto-pilot banner ── */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
        style={{
          background: autoPilot ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.03)',
          border: autoPilot ? '1px solid rgba(20,184,166,0.2)' : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex-1 min-w-0">
          {autoPilot ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold text-white">Modo automático ativado.</span>{' '}
              O Destaka aplica as melhorias sem precisar de aprovação.
            </p>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Quer que o Destaka aplique tudo automaticamente?{' '}
              <span className="font-semibold text-white">Ative o modo automático.</span>
            </p>
          )}
        </div>
        <button
          onClick={handleAutoToggle}
          disabled={autoToggling}
          className="shrink-0 relative w-12 h-7 rounded-full transition-colors duration-200"
          style={{
            background: autoPilot ? '#14B8A6' : 'rgba(255,255,255,0.12)',
          }}
          aria-label={autoPilot ? 'Desativar modo automático' : 'Ativar modo automático'}
        >
          <span
            className="absolute top-1 w-5 h-5 rounded-full bg-white transition-transform duration-200"
            style={{
              left: 4,
              transform: autoPilot ? 'translateX(20px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      {/* ── Score projection ── */}
      {currentScore !== null && boost > 0 && (
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Score atual:</span>
            <span className="font-display font-bold text-white text-lg">{currentScore}</span>
            <span style={{ color: 'var(--text-muted)' }}>{'\u2192'}</span>
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Score projetado:</span>
            <span className="font-display font-bold text-lg" style={{ color: '#4ADE80' }}>
              {currentScore + boost}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}
            >
              +{boost} pts
            </span>
          </div>
        </div>
      )}

      {/* ── Section: Descrição ── */}
      {descVariants.length > 0 && descStatus !== 'done' && (
        <section>
          <SectionHeader title="Descrição" />
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="px-5 pt-5 pb-3">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Escolha uma das opções abaixo ou edite antes de aplicar.
              </p>
            </div>

            {/* Current description */}
            {currentDescription && (
              <div className="px-5 pb-3">
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                    Descrição atual
                  </p>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    {currentDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Variants */}
            <div className="px-5 pb-3 space-y-2">
              {descVariants.map((v, i) => {
                const cfg = FOCUS_CONFIG[v.focus] ?? FOCUS_CONFIG.seo
                const isSelected = selectedVariant === i
                return (
                  <label
                    key={i}
                    className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                    style={{
                      background: isSelected ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid rgba(20,184,166,0.25)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <input
                      type="radio"
                      name="desc-variant"
                      checked={isSelected}
                      onChange={() => handleSelectVariant(i)}
                      className="mt-1"
                      style={{ accentColor: '#14B8A6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {v.char_count || v.text.length} caracteres
                        </span>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {v.text}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Editable textarea */}
            {selectedVariant !== null && (
              <div className="px-5 pb-4">
                <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Edite o texto antes de aplicar (opcional)
                </p>
                <textarea
                  value={descriptionText}
                  onChange={e => { setDescriptionText(e.target.value); setDescStatus('idle') }}
                  rows={5}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px]" style={{ color: descriptionText.length > 750 ? '#F87171' : 'rgba(255,255,255,0.3)' }}>
                    {descriptionText.length}/750 caracteres
                  </span>
                  <SectionButton
                    label="Aplicar descrição"
                    status={descStatus}
                    disabled={!descriptionText.trim() || descriptionText.length < 50 || descriptionText.length > 750}
                    onClick={handleApplyDescription}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Section: Atributos (Informações do local) ── */}
      {attrSuggestions.length > 0 && attrStatus !== 'done' && (
        <section>
          <SectionHeader title="Informações do local" />
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Warning */}
            <div className="px-5 pt-5 pb-3">
              <div
                className="rounded-xl px-4 py-3 text-[12px]"
                style={{ background: 'rgba(251,191,36,0.08)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.12)' }}
              >
                Confirme apenas atributos verdadeiros para o seu estabelecimento.
              </div>
            </div>

            {/* Competitor attributes */}
            <div className="px-5 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Seus concorrentes oferecem
              </p>
              <div className="space-y-2">
                {attrSuggestions.map((attr, i) => {
                  const checked = confirmedAttrs.has(i)
                  return (
                    <label
                      key={i}
                      className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                      style={{
                        background: checked ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)',
                        border: checked ? '1px solid rgba(20,184,166,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAttribute(i)}
                        className="mt-1"
                        style={{ accentColor: '#14B8A6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-white">{attr.attribute}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          {attr.justification}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="px-5 pb-4 flex justify-end">
              <SectionButton
                label="Aplicar atributos selecionados"
                status={attrStatus}
                disabled={confirmedAttrs.size === 0}
                onClick={handleApplyAttributes}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Section: Categorias ── */}
      {catSuggestions.length > 0 && catStatus !== 'done' && (
        <section>
          <SectionHeader title="Categorias" />
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Current categories */}
            {currentCategories.length > 0 && (
              <div className="px-5 pt-5 pb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Categorias atuais
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentCategories.map((cat, i) => (
                    <span
                      key={i}
                      className="text-[12px] px-3 py-1 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="px-5 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 mt-3" style={{ color: 'var(--text-muted)' }}>
                Sugestões baseadas nos concorrentes
              </p>
              <div className="space-y-2">
                {catSuggestions.map((cat, i) => {
                  const checked = selectedCategories.has(i)
                  return (
                    <label
                      key={i}
                      className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                      style={{
                        background: checked ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)',
                        border: checked ? '1px solid rgba(20,184,166,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(i)}
                        className="mt-1"
                        style={{ accentColor: '#14B8A6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-white">{cat.category}</p>
                          {cat.used_by_competitors && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(168,85,247,0.15)', color: '#C084FC' }}
                            >
                              Concorrentes usam
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          {cat.justification}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="px-5 pb-4 flex justify-end">
              <SectionButton
                label="Aplicar categorias"
                status={catStatus}
                disabled={selectedCategories.size === 0}
                onClick={handleApplyCategories}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Section: Serviços ── */}
      {svcOptimizations.length > 0 && svcStatus !== 'done' && (
        <section>
          <SectionHeader title="Serviços" />
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Onboarding services (read-only) */}
            {onboardingServices.length > 0 && (
              <div className="px-5 pt-5 pb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Serviços do seu cadastro
                </p>
                <div className="flex flex-wrap gap-2">
                  {onboardingServices.map((svc, i) => (
                    <span
                      key={i}
                      className="text-[12px] px-3 py-1 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Optimized versions */}
            <div className="px-5 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 mt-3" style={{ color: 'var(--text-muted)' }}>
                Nomes otimizados para o Google
              </p>
              <div className="space-y-3">
                {svcOptimizations.map((svc, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[12px]" style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {svc.original}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{'\u2192'}</span>
                    </div>
                    <input
                      type="text"
                      value={editedServices[i] ?? svc.optimized}
                      onChange={e => {
                        setEditedServices(prev => ({ ...prev, [i]: e.target.value }))
                        setSvcStatus('idle')
                      }}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    {svc.keywords_added.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
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
                ))}
              </div>
            </div>

            <div className="px-5 pb-4 flex justify-end">
              <SectionButton
                label="Aplicar serviços otimizados"
                status={svcStatus}
                disabled={svcOptimizations.length === 0}
                onClick={handleApplyServices}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Section: Já aplicados (collapsible) ── */}
      {(descStatus === 'done' || catStatus === 'done' || attrStatus === 'done' || svcStatus === 'done') && (
        <section>
          <button
            onClick={() => setAppliedOpen(!appliedOpen)}
            className="flex items-center gap-2 w-full text-left"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200"
              style={{ transform: appliedOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              Já aplicados nesta sessão
            </span>
          </button>
          {appliedOpen && (
            <div
              className="mt-3 rounded-2xl px-5 py-4 space-y-2"
              style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.1)' }}
            >
              {descStatus === 'done' && (
                <AppliedItem label="Descrição atualizada" />
              )}
              {catStatus === 'done' && (
                <AppliedItem label={`${selectedCategories.size} ${selectedCategories.size === 1 ? 'categoria adicionada' : 'categorias adicionadas'}`} />
              )}
              {attrStatus === 'done' && (
                <AppliedItem label={`${confirmedAttrs.size} ${confirmedAttrs.size === 1 ? 'atributo adicionado' : 'atributos adicionados'}`} />
              )}
              {svcStatus === 'done' && (
                <AppliedItem label="Serviços otimizados aplicados" />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

/* ─── Sub-components ─── */

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="font-display font-bold text-white text-lg mb-3">
      {title}
    </h2>
  )
}

function SectionButton({
  label,
  status,
  disabled,
  onClick,
}: {
  label: string
  status: SectionStatus
  disabled: boolean
  onClick: () => void
}) {
  if (status === 'done') {
    return (
      <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#4ADE80' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Aplicado
      </span>
    )
  }

  if (status === 'error') {
    return (
      <button
        onClick={onClick}
        className="text-sm font-bold px-4 py-2 rounded-xl transition-all"
        style={{
          background: 'rgba(248,113,113,0.15)',
          border: '1px solid rgba(248,113,113,0.25)',
          color: '#F87171',
        }}
      >
        Erro. Tentar novamente
      </button>
    )
  }

  const isApplying = status === 'applying'
  const canClick = !disabled && !isApplying

  return (
    <button
      onClick={onClick}
      disabled={!canClick}
      className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
      style={{
        background: canClick ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.04)',
        border: canClick ? '1px solid rgba(20,184,166,0.25)' : '1px solid rgba(255,255,255,0.06)',
        color: canClick ? '#14B8A6' : 'rgba(255,255,255,0.25)',
        cursor: canClick ? 'pointer' : 'not-allowed',
      }}
    >
      {isApplying ? 'Aplicando...' : label}
    </button>
  )
}

function AppliedItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}
