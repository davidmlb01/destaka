'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'permissions' | 'specialty' | 'name' | 'tone' | 'automation' | 'calculating' | 'done'

const SPECIALTIES = [
  { value: 'dentista', label: 'Dentista' },
  { value: 'medico', label: 'Médico' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
  { value: 'psicologo', label: 'Psicólogo' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'outro', label: 'Outro' },
]

const TONES = [
  {
    value: 'formal',
    label: 'Formal',
    description: 'Linguagem técnica e profissional, distância respeitosa.',
    example: '"Agradecemos sua confiança em nossos serviços."',
  },
  {
    value: 'proximo',
    label: 'Próximo',
    description: 'Tom caloroso e acolhedor, como conversar com um amigo.',
    example: '"Fico feliz que tenha nos escolhido! Qualquer dúvida, estou aqui."',
  },
  {
    value: 'tecnico',
    label: 'Técnico',
    description: 'Explicações detalhadas, público que aprecia profundidade.',
    example: '"O procedimento utiliza tecnologia de última geração para..."',
  },
]

const AUTOMATION_OPTIONS = [
  {
    value: 'manual',
    label: 'Revisar antes de publicar',
    description: 'Você aprova cada post e resposta antes de ir ao ar. Recomendado para quem está começando.',
  },
  {
    value: 'automatico',
    label: 'Publicar automaticamente',
    description: 'O Destaka publica posts e responde avaliações sem intervenção. Você recebe um resumo semanal.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('permissions')
  const [specialty, setSpecialty] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [tone, setTone] = useState('')
  const [automation, setAutomation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFinish() {
    setStep('calculating')
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clinicName,
          specialty,
          tone,
          automation_preference: automation,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao salvar dados')
      }

      // Simula cálculo do score (2s)
      await new Promise(r => setTimeout(r, 2000))
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setStep('automation')
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = 5
  const stepIndex: Record<Step, number> = {
    permissions: 1,
    specialty: 2,
    name: 3,
    tone: 4,
    automation: 5,
    calculating: 5,
    done: 5,
  }
  const progress = (stepIndex[step] / totalSteps) * 100

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Progress bar */}
        {step !== 'calculating' && step !== 'done' && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Passo {stepIndex[step]} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full">
              <div
                className="h-1.5 bg-slate-900 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          {/* STEP: Permissions */}
          {step === 'permissions' && (
            <div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                O que pedimos permissão para fazer
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Na próxima etapa, o Google vai perguntar se você autoriza o Destaka. Veja exatamente o que cada permissão significa:
              </p>
              <div className="space-y-4 mb-8">
                <PermissionItem
                  icon="👁"
                  title="Ler seu perfil no Google Meu Negócio"
                  description="Vemos seu nome, endereço, telefone, horários e avaliações. Isso nos permite calcular seu Score Destaka."
                />
                <PermissionItem
                  icon="✏️"
                  title="Editar seu perfil no Google Meu Negócio"
                  description="Quando você aprovar, atualizamos fotos, posts e respostas. Nada é publicado sem sua confirmação na primeira semana."
                />
                <PermissionItem
                  icon="🔍"
                  title="Ver sua posição nas buscas do Google"
                  description="Monitoramos onde você aparece no Google Maps e nas buscas para calcular se está crescendo ou perdendo espaço."
                />
              </div>
              <p className="text-xs text-slate-400 mb-6">
                O Destaka não compartilha seus dados com terceiros e não pode publicar nada no Google sem sua revisão.
              </p>
              <button
                onClick={() => setStep('specialty')}
                className="w-full bg-slate-900 text-white rounded-xl px-6 py-3.5 font-medium hover:bg-slate-800 transition-colors"
              >
                Entendido, continuar
              </button>
            </div>
          )}

          {/* STEP: Specialty */}
          {step === 'specialty' && (
            <div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                Qual é a sua especialidade?
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Usamos isso para personalizar os posts e respostas para a linguagem da sua área.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {SPECIALTIES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSpecialty(s.value)}
                    className={`p-4 rounded-xl border text-sm font-medium text-left transition-colors ${
                      specialty === s.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('name')}
                disabled={!specialty}
                className="w-full bg-slate-900 text-white rounded-xl px-6 py-3.5 font-medium hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          )}

          {/* STEP: Clinic Name */}
          {step === 'name' && (
            <div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                Como se chama seu consultório?
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Use o nome como aparece no Google Meu Negócio.
              </p>
              <input
                type="text"
                value={clinicName}
                onChange={e => setClinicName(e.target.value)}
                placeholder="Ex: Clínica Dr. João Silva"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 mb-8"
                autoFocus
              />
              <button
                onClick={() => setStep('tone')}
                disabled={!clinicName.trim()}
                className="w-full bg-slate-900 text-white rounded-xl px-6 py-3.5 font-medium hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          )}

          {/* STEP: Tone */}
          {step === 'tone' && (
            <div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                Como você prefere se comunicar com pacientes?
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Vamos usar esse tom em posts, respostas a avaliações e emails.
              </p>
              <div className="space-y-3 mb-8">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`w-full p-4 rounded-xl border text-left transition-colors ${
                      tone === t.value
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900 mb-0.5">{t.label}</p>
                    <p className="text-xs text-slate-500 mb-2">{t.description}</p>
                    <p className="text-xs text-slate-400 italic">{t.example}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('automation')}
                disabled={!tone}
                className="w-full bg-slate-900 text-white rounded-xl px-6 py-3.5 font-medium hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          )}

          {/* STEP: Automation */}
          {step === 'automation' && (
            <div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                Como prefere que o Destaka atue?
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Você pode mudar isso a qualquer momento nas configurações.
              </p>
              {error && (
                <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-xl">{error}</p>
              )}
              <div className="space-y-3 mb-8">
                {AUTOMATION_OPTIONS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => setAutomation(a.value)}
                    className={`w-full p-4 rounded-xl border text-left transition-colors ${
                      automation === a.value
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900 mb-0.5">{a.label}</p>
                    <p className="text-xs text-slate-500">{a.description}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={handleFinish}
                disabled={!automation || loading}
                className="w-full bg-slate-900 text-white rounded-xl px-6 py-3.5 font-medium hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ativar meu Destaka
              </button>
            </div>
          )}

          {/* STEP: Calculating */}
          {step === 'calculating' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                Calculando seu Score Destaka
              </h1>
              <p className="text-slate-500 text-sm">
                Analisando seu perfil no Google e calculando sua pontuação inicial...
              </p>
            </div>
          )}

          {/* STEP: Done */}
          {step === 'done' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl font-bold">38</span>
              </div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Score Destaka inicial</p>
              <h1 className="text-xl font-semibold text-slate-900 mb-3">
                Você está no piloto automático
              </h1>
              <p className="text-slate-500 text-sm mb-2">
                Seu score atual é <strong>38/100</strong>, faixa <strong>Funcional</strong>. A maioria dos consultórios começa aqui.
              </p>
              <p className="text-slate-500 text-sm mb-8">
                Nos próximos 30 dias, o Destaka vai otimizar seu perfil, publicar posts semanais e monitorar suas avaliações para levar você à faixa <strong>Forte</strong>.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-slate-900 text-white rounded-xl px-6 py-3.5 font-medium hover:bg-slate-800 transition-colors"
              >
                Ver meu painel
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}

function PermissionItem({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <span className="text-xl shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-medium text-slate-900 mb-1">{title}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
