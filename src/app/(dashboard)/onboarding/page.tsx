'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Step =
  | 'welcome'
  | 'confirm'
  | 'contact'
  | 'routine'
  | 'services'
  | 'automation'
  | 'activating'
  | 'done'

interface PrefillData {
  name: string
  phone: string
  category: string
  address: string
}

const SPECIALTIES = [
  { value: 'dentista', label: 'Dentista' },
  { value: 'medico', label: 'Medico' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
  { value: 'psicologo', label: 'Psicologo' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'veterinario', label: 'Veterinario' },
  { value: 'outro', label: 'Outro' },
]

const CHALLENGES = [
  { value: 'more_patients', label: 'Atrair mais pacientes novos' },
  { value: 'more_reviews', label: 'Aumentar avaliacoes positivas' },
  { value: 'more_visibility', label: 'Aparecer melhor no Google' },
  { value: 'all', label: 'Melhorar tudo, nao sei por onde comecar' },
]

const VOLUMES = [
  { value: 'under_10', label: 'Menos de 10' },
  { value: '10_30', label: 'Entre 10 e 30' },
  { value: '30_60', label: 'Entre 30 e 60' },
  { value: 'over_60', label: 'Mais de 60' },
]

const AUTOMATION_OPTIONS = [
  {
    value: 'automatico',
    label: 'Automatico',
    description:
      'Publicamos posts e respondemos avaliacoes automaticamente. Voce recebe um resumo semanal.',
  },
  {
    value: 'manual',
    label: 'Com aprovacao',
    description:
      'Enviamos tudo para sua aprovacao no WhatsApp antes de publicar.',
  },
]

const ACTIVATION_STEPS = [
  'Perfil conectado',
  'Fotos analisadas',
  'Avaliacoes lidas',
  'Concorrentes mapeados',
  'Plano de melhoria criado',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')

  // Prefill from Google
  const [prefill, setPrefill] = useState<PrefillData | null>(null)
  const [prefillLoading, setPrefillLoading] = useState(true)

  // Block 1: Confirm
  const [clinicName, setClinicName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [address, setAddress] = useState('')

  // Block 2: Contact
  const [phone, setPhone] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')

  // Block 3: Routine
  const [challenge, setChallenge] = useState('')
  const [patientVolume, setPatientVolume] = useState('')

  // Block 4: Services
  const [services, setServices] = useState<string[]>([''])
  const [differentials, setDifferentials] = useState('')

  // Block 5: Automation
  const [automation, setAutomation] = useState('')

  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Activation animation
  const [activationStep, setActivationStep] = useState(0)
  const [activationDone, setActivationDone] = useState(false)
  const [improvementCount, setImprovementCount] = useState(0)
  const [autoCount, setAutoCount] = useState(0)

  // Fetch prefill data from Google on mount
  useEffect(() => {
    async function fetchPrefill() {
      try {
        const res = await fetch('/api/onboarding/prefill')
        if (res.ok) {
          const data = await res.json()
          if (data.completed) {
            router.replace('/dashboard')
            return
          }
          if (data.location) {
            const loc = data.location
            setPrefill(loc)
            setClinicName(loc.name || '')
            setBusinessPhone(loc.phone || '')
            setAddress(loc.address || '')
            // Try to match specialty from category
            const cat = (loc.category || '').toLowerCase()
            const match = SPECIALTIES.find(s => cat.includes(s.value))
            if (match) setSpecialty(match.value)
          }
        }
      } catch {
        // Prefill is optional, continue without it
      } finally {
        setPrefillLoading(false)
      }
    }
    fetchPrefill()
  }, [])

  // Activation animation sequence
  const runActivation = useCallback(async () => {
    for (let i = 0; i < ACTIVATION_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 800))
      setActivationStep(i + 1)
    }
    await new Promise(r => setTimeout(r, 500))
    // These would come from the API response in production
    setImprovementCount(8)
    setAutoCount(3)
    setActivationDone(true)
  }, [])

  async function handleFinish() {
    setStep('activating')
    setLoading(true)
    setActivationStep(0)
    setActivationDone(false)

    try {
      const filteredServices = services.filter(s => s.trim())

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clinicName,
          specialty,
          tone: 'proximo',
          automation_preference: automation,
          phone,
          instagram_handle: instagramHandle || null,
          challenge,
          patient_volume: patientVolume,
          services: filteredServices.length > 0 ? filteredServices : null,
          differentials: differentials.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao salvar dados')
      }

      await runActivation()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setStep('automation')
    } finally {
      setLoading(false)
    }
  }

  // Progress
  const FORM_STEPS: Step[] = ['confirm', 'contact', 'routine', 'services', 'automation']
  const currentIndex = FORM_STEPS.indexOf(step)
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / FORM_STEPS.length) * 100 : 0

  // Service list helpers
  function updateService(index: number, value: string) {
    const updated = [...services]
    updated[index] = value
    setServices(updated)
  }

  function addService() {
    if (services.length < 8) {
      setServices([...services, ''])
    }
  }

  function removeService(index: number) {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index))
    }
  }

  // Phone formatter
  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length > 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    if (digits.length > 2) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    }
    return digits
  }

  const isFormStep = currentIndex >= 0

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div className="w-full max-w-lg">

        {/* Progress bar */}
        {isFormStep && (
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>Passo {currentIndex + 1} de {FORM_STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'var(--accent)' }}
              />
            </div>
          </div>
        )}

        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >

          {/* WELCOME */}
          {step === 'welcome' && (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(20,184,166,0.15)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white mb-2">
                Assinatura confirmada
              </h1>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Vamos configurar seu perfil em 2 minutos.
              </p>
              <button
                onClick={() => setStep(prefill ? 'confirm' : 'confirm')}
                disabled={prefillLoading}
                className="w-full rounded-xl px-6 py-3.5 font-medium transition-colors disabled:opacity-40"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {prefillLoading ? 'Carregando...' : 'Comecar'}
              </button>
            </div>
          )}

          {/* BLOCK 1: CONFIRM GOOGLE DATA */}
          {step === 'confirm' && (
            <div>
              <h1 className="text-lg font-semibold text-white mb-1">
                {prefill ? 'Encontramos seu perfil no Google' : 'Dados do seu consultorio'}
              </h1>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {prefill
                  ? 'Confirme se os dados estao corretos.'
                  : 'Preencha as informacoes do seu consultorio.'}
              </p>

              <div className="space-y-4 mb-6">
                <FieldGroup label="Nome do consultorio">
                  <input
                    type="text"
                    value={clinicName}
                    onChange={e => setClinicName(e.target.value)}
                    placeholder="Ex: Clinica Dr. Joao Silva"
                    className="onboarding-input"
                    autoFocus
                  />
                </FieldGroup>

                <FieldGroup label="Especialidade">
                  <div className="grid grid-cols-2 gap-2">
                    {SPECIALTIES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setSpecialty(s.value)}
                        className="px-3 py-2.5 rounded-lg text-sm text-left transition-colors"
                        style={{
                          background: specialty === s.value ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                          color: specialty === s.value ? '#fff' : 'rgba(255,255,255,0.7)',
                          border: `1px solid ${specialty === s.value ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </FieldGroup>

                {prefill && (
                  <>
                    <FieldGroup label="Telefone comercial">
                      <input
                        type="text"
                        value={businessPhone}
                        onChange={e => setBusinessPhone(e.target.value)}
                        className="onboarding-input"
                        readOnly={!!prefill.phone}
                        style={prefill.phone ? { opacity: 0.7 } : undefined}
                      />
                    </FieldGroup>

                    <FieldGroup label="Endereco">
                      <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="onboarding-input"
                        readOnly={!!prefill.address}
                        style={prefill.address ? { opacity: 0.7 } : undefined}
                      />
                    </FieldGroup>
                  </>
                )}
              </div>

              <button
                onClick={() => setStep('contact')}
                disabled={!clinicName.trim() || !specialty}
                className="w-full rounded-xl px-6 py-3.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {prefill ? 'Confirmar e continuar' : 'Continuar'}
              </button>
            </div>
          )}

          {/* BLOCK 2: CONTACT */}
          {step === 'contact' && (
            <div>
              <h1 className="text-lg font-semibold text-white mb-1">
                Como entrar em contato com voce?
              </h1>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Enviamos relatorios e alertas por WhatsApp. Sem spam, apenas o que importa.
              </p>

              <div className="space-y-4 mb-6">
                <FieldGroup label="WhatsApp">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="onboarding-input"
                    autoFocus
                  />
                </FieldGroup>

                <FieldGroup label="Instagram do consultorio (opcional)">
                  <input
                    type="text"
                    value={instagramHandle}
                    onChange={e => {
                      let val = e.target.value.trim()
                      if (val && !val.startsWith('@')) val = `@${val}`
                      setInstagramHandle(val)
                    }}
                    placeholder="@seuconsultorio"
                    className="onboarding-input"
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Se informado, reaproveitamos seus posts do Instagram no Google.
                  </p>
                </FieldGroup>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('confirm')}
                  className="rounded-xl px-5 py-3.5 font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep('routine')}
                  disabled={phone.replace(/\D/g, '').length < 10}
                  className="flex-1 rounded-xl px-6 py-3.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* BLOCK 3: ROUTINE */}
          {step === 'routine' && (
            <div>
              <h1 className="text-lg font-semibold text-white mb-1">
                O que mais importa para voce hoje?
              </h1>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Usamos essa informacao para priorizar as acoes no seu perfil.
              </p>

              <div className="space-y-2 mb-6">
                {CHALLENGES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setChallenge(c.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-left transition-colors"
                    style={{
                      background: challenge === c.value ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.04)',
                      color: challenge === c.value ? 'var(--accent-bright)' : 'rgba(255,255,255,0.7)',
                      border: `1px solid ${challenge === c.value ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <FieldGroup label="Quantos pacientes voce atende por semana?">
                <div className="grid grid-cols-2 gap-2">
                  {VOLUMES.map(v => (
                    <button
                      key={v.value}
                      onClick={() => setPatientVolume(v.value)}
                      className="px-3 py-2.5 rounded-lg text-sm transition-colors"
                      style={{
                        background: patientVolume === v.value ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                        color: patientVolume === v.value ? '#fff' : 'rgba(255,255,255,0.7)',
                        border: `1px solid ${patientVolume === v.value ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </FieldGroup>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('contact')}
                  className="rounded-xl px-5 py-3.5 font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep('services')}
                  disabled={!challenge || !patientVolume}
                  className="flex-1 rounded-xl px-6 py-3.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* BLOCK 4: SERVICES */}
          {step === 'services' && (
            <div>
              <h1 className="text-lg font-semibold text-white mb-1">
                Quais sao seus principais servicos?
              </h1>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Usamos essa informacao para criar conteudo relevante no seu perfil do Google.
              </p>

              <div className="space-y-2 mb-4">
                {services.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={s}
                      onChange={e => updateService(i, e.target.value)}
                      placeholder={
                        i === 0 ? 'Ex: Consulta e avaliacao' :
                        i === 1 ? 'Ex: Limpeza e profilaxia' :
                        i === 2 ? 'Ex: Clareamento dental' :
                        'Adicionar servico'
                      }
                      className="onboarding-input flex-1"
                      autoFocus={i === services.length - 1 && services.length > 1}
                    />
                    {services.length > 1 && (
                      <button
                        onClick={() => removeService(i)}
                        className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}
                        aria-label="Remover servico"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {services.length < 8 && (
                <button
                  onClick={addService}
                  className="text-sm mb-6 transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  + Adicionar servico
                </button>
              )}

              <FieldGroup label="Algo que diferencia seu consultorio? (opcional)">
                <textarea
                  value={differentials}
                  onChange={e => setDifferentials(e.target.value)}
                  placeholder="Ex: 15 anos de experiencia, especialista em pacientes com medo de dentista"
                  className="onboarding-input min-h-[80px] resize-none"
                  maxLength={300}
                />
              </FieldGroup>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('routine')}
                  className="rounded-xl px-5 py-3.5 font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep('automation')}
                  disabled={!services.some(s => s.trim())}
                  className="flex-1 rounded-xl px-6 py-3.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* BLOCK 5: AUTOMATION */}
          {step === 'automation' && (
            <div>
              <h1 className="text-lg font-semibold text-white mb-1">
                Como prefere que o Destaka atue?
              </h1>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Voce pode mudar isso a qualquer momento nas configuracoes.
              </p>

              {error && (
                <p
                  className="text-sm mb-4 p-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  {error}
                </p>
              )}

              <div className="space-y-3 mb-6">
                {AUTOMATION_OPTIONS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => setAutomation(a.value)}
                    className="w-full p-4 rounded-xl text-left transition-colors"
                    style={{
                      background: automation === a.value ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${automation === a.value ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <p className="text-sm font-medium mb-0.5" style={{ color: automation === a.value ? 'var(--accent-bright)' : '#fff' }}>
                      {a.label}
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {a.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('services')}
                  className="rounded-xl px-5 py-3.5 font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Voltar
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!automation || loading}
                  className="flex-1 rounded-xl px-6 py-3.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  Ativar meu Destaka
                </button>
              </div>
            </div>
          )}

          {/* ACTIVATING */}
          {step === 'activating' && (
            <div className="py-4">
              {!activationDone ? (
                <>
                  <h1 className="text-lg font-semibold text-white mb-6">
                    Analisando seu perfil...
                  </h1>
                  <div className="space-y-3">
                    {ACTIVATION_STEPS.map((label, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                          style={{
                            background: i < activationStep ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                          }}
                        >
                          {i < activationStep ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : i === activationStep ? (
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                          ) : null}
                        </div>
                        <span
                          className="text-sm transition-colors duration-300"
                          style={{
                            color: i < activationStep
                              ? 'rgba(255,255,255,0.9)'
                              : i === activationStep
                                ? 'var(--accent)'
                                : 'rgba(255,255,255,0.3)',
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgba(20,184,166,0.15)' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h1 className="text-lg font-semibold text-white mb-2">
                    Perfil configurado
                  </h1>
                  <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Encontramos {improvementCount} melhorias para aplicar no seu perfil. {autoCount} delas sao automaticas.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full rounded-xl px-6 py-3.5 font-medium transition-colors"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    Acessar meu painel
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .onboarding-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }
        .onboarding-input::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .onboarding-input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </main>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
