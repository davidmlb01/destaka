'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { HEALTH_ATTRIBUTES, ATTRIBUTE_GROUPS } from '@/lib/gmb/attributes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

interface DayHours {
  open: string
  close: string
  closed: boolean
}

type BusinessHours = Record<DayKey, DayHours>

const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const DAYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DEFAULT_HOURS: BusinessHours = {
  monday:    { open: '', close: '', closed: true },
  tuesday:   { open: '', close: '', closed: true },
  wednesday: { open: '', close: '', closed: true },
  thursday:  { open: '', close: '', closed: true },
  friday:    { open: '', close: '', closed: true },
  saturday:  { open: '', close: '', closed: true },
  sunday:    { open: '', close: '', closed: true },
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfileSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [specialty, setSpecialty] = useState('')
  const [bio, setBio] = useState('')

  // Step 2
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS)

  // Step 3
  const [services, setServices] = useState<string[]>(['', '', ''])

  // Step 4
  const [selectedAttrs, setSelectedAttrs] = useState<Set<string>>(new Set())

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function updateDay(day: DayKey, field: keyof DayHours, value: string | boolean) {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  function addService() {
    if (services.length < 12) setServices(prev => [...prev, ''])
  }

  function removeService(idx: number) {
    setServices(prev => prev.filter((_, i) => i !== idx))
  }

  function updateService(idx: number, value: string) {
    setServices(prev => prev.map((s, i) => i === idx ? value : s))
  }

  function toggleAttr(id: string) {
    setSelectedAttrs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // -------------------------------------------------------------------------
  // Validation per step
  // -------------------------------------------------------------------------

  function canProceed(): boolean {
    if (step === 1) return specialty.trim().length >= 2
    if (step === 2) {
      const hasAtLeastOneDay = DAYS.some(d => !hours[d].closed && hours[d].open && hours[d].close)
      return hasAtLeastOneDay
    }
    if (step === 3) return services.filter(s => s.trim()).length >= 1
    return true
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  async function handleSubmit() {
    setSaving(true)
    setError('')

    const body = {
      specialty: specialty.trim(),
      businessHours: hours,
      servicesInput: services.filter(s => s.trim()),
      attributesSelected: Array.from(selectedAttrs),
      bio: bio.trim() || undefined,
    }

    try {
      const res = await fetch('/api/gmb/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao salvar. Tente novamente.')
        setSaving(false)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div
        className="fixed rounded-full pointer-events-none blur-[140px]"
        style={{ width: 500, height: 500, background: 'rgba(14,165,233,0.12)', top: -150, right: -150 }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <Logo size="lg" href="/" />
        </div>

        <StepIndicator current={step} />

        <div className="mt-8">
          {step === 1 && (
            <StepSpecialty specialty={specialty} onChangeSpecialty={setSpecialty} bio={bio} onChangeBio={setBio} />
          )}
          {step === 2 && (
            <StepHours hours={hours} updateDay={updateDay} />
          )}
          {step === 3 && (
            <StepServices
              services={services}
              onAdd={addService}
              onRemove={removeService}
              onChange={updateService}
            />
          )}
          {step === 4 && (
            <StepAttributes selected={selectedAttrs} onToggle={toggleAttr} />
          )}
        </div>

        {error && (
          <p className="mt-4 text-center text-sm" style={{ color: 'rgba(239,68,68,0.9)' }}>
            {error}
          </p>
        )}

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
              disabled={saving}
              className="flex-1"
            >
              Voltar
            </Button>
          )}

          {step < 4 ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Continuar
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Salvando...' : 'Concluir configuração'}
            </Button>
          )}
        </div>

        {step === 4 && (
          <p className="mt-4 text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Você pode atualizar essas informações a qualquer momento nas configurações do perfil.
          </p>
        )}
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { n: 1, label: 'Especialidade' },
    { n: 2, label: 'Horários' },
    { n: 3, label: 'Serviços' },
    { n: 4, label: 'Estrutura' },
  ]
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                background: s.n <= current ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                color: s.n <= current ? '#fff' : 'rgba(255,255,255,0.3)',
              }}
            >
              {s.n < current ? '✓' : s.n}
            </div>
            <span className="text-xs hidden sm:block" style={{ color: s.n === current ? 'var(--accent)' : 'rgba(255,255,255,0.3)' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-8 h-0.5 mb-4"
              style={{ background: s.n < current ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1
// ---------------------------------------------------------------------------

function StepSpecialty({
  specialty,
  onChangeSpecialty,
  bio,
  onChangeBio,
}: {
  specialty: string
  onChangeSpecialty: (v: string) => void
  bio: string
  onChangeBio: (v: string) => void
}) {
  return (
    <div>
      <h2 className="font-display font-extrabold text-white text-2xl mb-2" style={{ letterSpacing: '-0.5px' }}>
        Sobre você e seu consultório
      </h2>
      <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Essas informações são usadas para gerar a descrição do seu perfil, os posts e as respostas a avaliações. Quanto mais preciso, melhor o resultado.
      </p>

      <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
        Especialidade <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span>
      </label>
      <input
        type="text"
        value={specialty}
        onChange={e => onChangeSpecialty(e.target.value)}
        placeholder="Ex: Endodontista, Cardiologista, Psiquiatra infantil, Fisioterapeuta ortopédico..."
        maxLength={200}
        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      />
      <p className="mt-1 mb-5 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {specialty.length}/200
      </p>

      <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
        Diferenciais do seu consultório <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.5)' }}>(opcional)</span>
      </label>
      <textarea
        value={bio}
        onChange={e => onChangeBio(e.target.value)}
        placeholder="Ex: 15 anos de experiência, especializado em pacientes com ansiedade odontológica, uso de sedação consciente, atendimento infantil e adulto..."
        maxLength={500}
        rows={3}
        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all resize-none"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      />
      <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {bio.length}/500
      </p>

      <div className="mt-5 rounded-xl p-4" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)' }}>
        <p className="text-xs" style={{ color: 'rgba(14,165,233,0.8)' }}>
          <strong>Por que pedimos isso?</strong> O Google ranqueia melhor perfis com descrições precisas. Um endodontista que aparece como "dentista genérico" perde posições para concorrentes com especialidade detalhada.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2
// ---------------------------------------------------------------------------

function StepHours({
  hours,
  updateDay,
}: {
  hours: BusinessHours
  updateDay: (day: DayKey, field: keyof DayHours, value: string | boolean) => void
}) {
  function applyWeekdays() {
    const weekdays: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    weekdays.forEach(day => {
      updateDay(day, 'closed', false)
      updateDay(day, 'open', '08:00')
      updateDay(day, 'close', '18:00')
    })
  }

  return (
    <div>
      <h2 className="font-display font-extrabold text-white text-2xl mb-2" style={{ letterSpacing: '-0.5px' }}>
        Qual é o seu horário de atendimento?
      </h2>
      <p className="mb-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Marque apenas os dias e horários em que você realmente atende. Dias fechados ficam marcados automaticamente.
      </p>

      <button
        type="button"
        onClick={applyWeekdays}
        className="mb-5 text-xs px-3 py-1.5 rounded-lg transition-all"
        style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--accent)', border: '1px solid rgba(14,165,233,0.2)' }}
      >
        Preencher seg a sex (08:00 às 18:00)
      </button>

      <div className="flex flex-col gap-2">
        {DAYS.map(day => (
          <div
            key={day}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: hours[day].closed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${hours[day].closed ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            {/* Toggle */}
            <button
              type="button"
              onClick={() => updateDay(day, 'closed', !hours[day].closed)}
              className="relative w-9 h-5 rounded-full transition-all flex-shrink-0"
              style={{
                background: hours[day].closed ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                style={{ left: hours[day].closed ? '2px' : '18px' }}
              />
            </button>

            {/* Day label */}
            <span
              className="w-16 text-sm font-medium flex-shrink-0"
              style={{ color: hours[day].closed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)' }}
            >
              {DAY_LABELS[day]}
            </span>

            {/* Hours */}
            {hours[day].closed ? (
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Fechado</span>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={hours[day].open}
                  onChange={e => updateDay(day, 'open', e.target.value)}
                  className="rounded-lg px-2 py-1 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>às</span>
                <input
                  type="time"
                  value={hours[day].close}
                  onChange={e => updateDay(day, 'close', e.target.value)}
                  className="rounded-lg px-2 py-1 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3
// ---------------------------------------------------------------------------

function StepServices({
  services,
  onAdd,
  onRemove,
  onChange,
}: {
  services: string[]
  onAdd: () => void
  onRemove: (i: number) => void
  onChange: (i: number, v: string) => void
}) {
  return (
    <div>
      <h2 className="font-display font-extrabold text-white text-2xl mb-2" style={{ letterSpacing: '-0.5px' }}>
        Quais serviços você oferece?
      </h2>
      <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Liste os principais serviços do seu consultório. Esses serviços serão adicionados ao seu perfil no Google e usados para gerar posts e a descrição.
      </p>

      <div className="flex flex-col gap-2">
        {services.map((s, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              value={s}
              onChange={e => onChange(i, e.target.value)}
              placeholder={`Ex: ${placeholderForIndex(i)}`}
              maxLength={100}
              className="flex-1 rounded-xl px-4 py-3 text-white text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            />
            {services.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.7)' }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {services.length < 12 && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 text-sm flex items-center gap-1 transition-all"
          style={{ color: 'var(--accent)' }}
        >
          + Adicionar serviço
        </button>
      )}

      <div className="mt-6 rounded-xl p-4" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)' }}>
        <p className="text-xs" style={{ color: 'rgba(14,165,233,0.8)' }}>
          <strong>Dica:</strong> Nomes de serviços que pacientes realmente pesquisam no Google convertem melhor. Prefira "Tratamento de canal" a "Endodontia".
        </p>
      </div>
    </div>
  )
}

function placeholderForIndex(i: number): string {
  const examples = [
    'Consulta e avaliação',
    'Tratamento de canal',
    'Implante dental',
    'Clareamento dental',
    'Aparelho ortodôntico',
    'Limpeza e profilaxia',
  ]
  return examples[i] ?? 'Serviço'
}

// ---------------------------------------------------------------------------
// Step 4
// ---------------------------------------------------------------------------

function StepAttributes({
  selected,
  onToggle,
}: {
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <h2 className="font-display font-extrabold text-white text-2xl mb-2" style={{ letterSpacing: '-0.5px' }}>
        Características do seu consultório
      </h2>
      <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Marque apenas o que realmente existe no seu consultório. Essas informações são publicadas no seu perfil do Google.
      </p>

      {ATTRIBUTE_GROUPS.map(group => {
        const attrs = HEALTH_ATTRIBUTES.filter(a => a.group === group)
        return (
          <div key={group} className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {group}
            </p>
            <div className="flex flex-col gap-2">
              {attrs.map(attr => (
                <button
                  key={attr.id}
                  type="button"
                  onClick={() => onToggle(attr.id)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                  style={{
                    background: selected.has(attr.id) ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selected.has(attr.id) ? 'rgba(14,165,233,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0 transition-all"
                    style={{
                      background: selected.has(attr.id) ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {selected.has(attr.id) ? '✓' : ''}
                  </span>
                  <span className="text-sm" style={{ color: selected.has(attr.id) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)' }}>
                    {attr.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      })}

      <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {selected.size === 0
          ? 'Nenhum atributo selecionado. Você pode pular esta etapa e configurar depois.'
          : `${selected.size} ${selected.size === 1 ? 'atributo selecionado' : 'atributos selecionados'}`}
      </p>
    </div>
  )
}
