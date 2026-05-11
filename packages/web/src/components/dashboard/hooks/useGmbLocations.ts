import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GmbLocation } from '@/lib/gmb/client'

type Step = 'loading' | 'select' | 'no_profiles' | 'error' | 'saving'

export function useGmbLocations() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('loading')
  const [locations, setLocations] = useState<GmbLocation[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [selected, setSelected] = useState<GmbLocation | null>(null)

  useEffect(() => {
    fetch('/api/gmb/locations')
      .then(async (res) => {
        if (res.status === 403) {
          const retries =
            Number(sessionStorage.getItem('onboarding_403_count') ?? '0') + 1
          sessionStorage.setItem('onboarding_403_count', String(retries))
          if (retries >= 3) {
            sessionStorage.removeItem('onboarding_403_count')
            setErrorMsg(
              'Não foi possível acessar seu Google Meu Negócio. Verifique se você autorizou o acesso completo e tente novamente.',
            )
            setStep('error')
            return
          }
          window.location.href = '/saude/login'
          return
        }
        sessionStorage.removeItem('onboarding_403_count')
        const data = (await res.json()) as {
          error?: string
          locations?: GmbLocation[]
          noProfiles?: boolean
        }
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

    const locationId = location.name

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
      router.push('/saude/dashboard')
      return
    }

    const data = await res.json()
    if (res.status === 409) {
      setErrorMsg(
        'Este perfil já está sendo monitorado por outro usuário. Entre em contato com o suporte.',
      )
    } else {
      setErrorMsg(data.error ?? 'Erro ao salvar perfil.')
    }
    setStep('error')
  }

  return {
    step,
    locations,
    errorMsg,
    selected,
    handleSelect,
  }
}
