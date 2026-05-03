'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { GmbLocation } from '@/lib/gmb/client'

type Step = 'loading' | 'select' | 'no_profiles' | 'error' | 'saving'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('loading')
  const [locations, setLocations] = useState<GmbLocation[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [selected, setSelected] = useState<GmbLocation | null>(null)

  useEffect(() => {
    fetch('/api/gmb/locations')
      .then(async (res) => {
        // 403 = scope não concedido — redireciona para login para reconectar
        if (res.status === 403) {
          const retries = Number(sessionStorage.getItem('onboarding_403_count') ?? '0') + 1
          sessionStorage.setItem('onboarding_403_count', String(retries))
          if (retries >= 3) {
            sessionStorage.removeItem('onboarding_403_count')
            setErrorMsg('Não foi possível acessar seu Google Meu Negócio. Verifique se você autorizou o acesso completo e tente novamente.')
            setStep('error')
            return
          }
          window.location.href = '/login'
          return
        }
        sessionStorage.removeItem('onboarding_403_count')
        const data = await res.json() as { error?: string; locations?: GmbLocation[]; noProfiles?: boolean }
        if (data.error) {
          setErrorMsg(data.error)
          setStep('error')
          return
        }
        if (data.noProfiles || !data.locations || data.locations.length === 0) {
          setStep('no_profiles')
          return
        }
        setLocations(data.locations)
        setStep('select')
      })
      .catch(() => {
        setErrorMsg('Não foi possível conectar com o Google. Tente novamente.')
        setStep('error')
      })
  }, [])

  async function handleSelect(location: GmbLocation) {
    setSelected(location)
    setStep('saving')

    const locationId = location.name // caminho completo: "accounts/{accountId}/locations/{locationId}"

    const res = await fetch('/api/gmb/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId,
        name: location.title,
        address: location.address,
        phone: location.phone,
        website: location.website,
        category: location.category,
      }),
    })

    if (res.ok) {
      router.push('/dashboard')
      return
    }

    const data = await res.json()
    if (res.status === 409) {
      setErrorMsg('Este perfil já está sendo monitorado por outro usuário. Entre em contato com o suporte.')
    } else {
      setErrorMsg(data.error ?? 'Erro ao salvar perfil.')
    }
    setStep('error')
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: 'linear-gradient(160deg, #14532D 0%, #0A2E18 100%)' }}
    >
      <div
        className="fixed rounded-full pointer-events-none blur-[140px]"
        style={{ width: 500, height: 500, background: 'rgba(217,119,6,0.12)', top: -150, right: -150 }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="md" />
        </div>

        {step === 'loading' && <LoadingState />}
        {step === 'no_profiles' && <NoProfilesState />}
        {step === 'error' && <ErrorState message={errorMsg} />}
        {step === 'saving' && selected && <SavingState name={selected.title} />}
        {step === 'select' && (
          <SelectState locations={locations} onSelect={handleSelect} />
        )}
      </div>
    </main>
  )
}

function LoadingState() {
  return (
    <div className="text-center">
      <div
        className="inline-block w-10 h-10 rounded-full border-2 border-t-transparent mb-6 animate-spin"
        style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#F59E0B' }}
      />
      <p className="font-display font-bold text-white text-lg">Buscando seus perfis no Google...</p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8 }}>Isso leva alguns segundos.</p>
    </div>
  )
}

function SavingState({ name }: { name: string }) {
  return (
    <div className="text-center">
      <div
        className="inline-block w-10 h-10 rounded-full border-2 border-t-transparent mb-6 animate-spin"
        style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#F59E0B' }}
      />
      <p className="font-display font-bold text-white text-lg">Conectando {name}...</p>
    </div>
  )
}

function NoProfilesState() {
  return (
    <Card variant="subtle" padding="lg" className="text-center">
      <div className="text-4xl mb-4">🔍</div>
      <h2 className="font-display font-extrabold text-white text-xl mb-3">
        Nenhum perfil encontrado
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.6 }}>
        Sua conta Google não tem um perfil no Google Meu Negócio.
        Crie um em <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#F59E0B' }}>business.google.com</a> e volte aqui.
      </p>
    </Card>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card variant="subtle" padding="lg" className="text-center" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="font-display font-extrabold text-white text-xl mb-3">Algo deu errado</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 24 }}>{message}</p>
      <Button variant="primary" size="md" href="/login">
        Tentar novamente
      </Button>
    </Card>
  )
}

function SelectState({
  locations,
  onSelect,
}: {
  locations: GmbLocation[]
  onSelect: (loc: GmbLocation) => void
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <h1
          className="font-display font-extrabold text-white mb-2"
          style={{ fontSize: 28, letterSpacing: '-0.5px' }}
        >
          Qual perfil vamos otimizar?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
          {locations.length === 1
            ? 'Encontramos 1 perfil vinculado à sua conta.'
            : `Encontramos ${locations.length} perfis vinculados à sua conta.`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {locations.map(loc => (
          <button
            key={loc.name}
            onClick={() => onSelect(loc)}
            className="w-full text-left rounded-2xl p-5 transition-all group location-card"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-white text-base mb-1 truncate">
                  {loc.title}
                </p>
                {loc.address && (
                  <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {loc.address}
                  </p>
                )}
                {loc.category && (
                  <p className="text-xs mt-1" style={{ color: 'rgba(245,158,11,0.7)' }}>
                    {loc.category}
                  </p>
                )}
              </div>
              <span className="text-lg mt-0.5" style={{ color: '#D97706' }}>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
