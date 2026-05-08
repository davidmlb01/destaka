'use client'

import { useEffect, useState } from 'react'

interface LoadingItem {
  id: number
  label: string
  status: 'wait' | 'active' | 'done'
}

const LOADING_STEPS: Omit<LoadingItem, 'status'>[] = [
  { id: 1, label: 'Localizando perfil no Google' },
  { id: 2, label: 'Verificando informações básicas' },
  { id: 3, label: 'Analisando fotos e avaliações' },
  { id: 4, label: 'Calculando score de visibilidade' },
]

const STEP_DELAYS = [800, 1800, 3000, 4200]

interface StepLoadingProps {
  clinicName: string
  city: string
  onComplete: () => void
  ready?: boolean
}

export function StepLoading({ clinicName, city, onComplete, ready }: StepLoadingProps) {
  const [items, setItems] = useState<LoadingItem[]>(
    LOADING_STEPS.map(s => ({ ...s, status: 'wait' }))
  )
  const [barWidth, setBarWidth] = useState(0)
  const BAR_TARGETS = [25, 50, 75, 95]

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    STEP_DELAYS.forEach((delay, i) => {
      // activate
      timers.push(setTimeout(() => {
        setItems(prev => prev.map(item => item.id === i + 1 ? { ...item, status: 'active' } : item))
        setBarWidth(BAR_TARGETS[i])

        // complete
        timers.push(setTimeout(() => {
          setItems(prev => prev.map(item => item.id === i + 1 ? { ...item, status: 'done' } : item))
        }, 800))
      }, delay))
    })

    // finish animation
    timers.push(setTimeout(() => {
      setBarWidth(100)
    }, 5400))

    return () => timers.forEach(clearTimeout)
  }, [])

  // Avança quando animação terminou E dados estão prontos
  useEffect(() => {
    if (barWidth === 100 && ready) {
      const t = setTimeout(onComplete, 400)
      return () => clearTimeout(t)
    }
  }, [barWidth, ready, onComplete])

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-10 bg-dark">
      <div className="max-w-[480px] w-full text-center">
        <div
          className="text-[40px] text-ambar mb-8"
          style={{ animation: 'pulse-star 2s ease-in-out infinite' }}
        >
          ✦
        </div>
        <h2 className="font-display font-extrabold text-[28px] text-white tracking-[-0.5px] mb-3">
          Analisando seu perfil...
        </h2>
        <p className="text-[15px] mb-12" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {clinicName} · {city}
        </p>

        <div className="flex flex-col gap-3.5 text-left">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300"
              style={{
                background: item.status === 'done'
                  ? 'rgba(22,163,74,0.12)'
                  : item.status === 'active'
                    ? 'rgba(14,165,233,0.10)'
                    : 'rgba(255,255,255,0.05)',
                border: item.status === 'done'
                  ? '1px solid rgba(22,163,74,0.2)'
                  : item.status === 'active'
                    ? '1px solid rgba(14,165,233,0.2)'
                    : '1px solid transparent',
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] flex-shrink-0 transition-all duration-300"
                style={{
                  background: item.status === 'done'
                    ? '#16A34A'
                    : item.status === 'active'
                      ? 'var(--accent-hover)'
                      : 'rgba(255,255,255,0.08)',
                  color: item.status === 'done'
                    ? 'white'
                    : item.status === 'active'
                      ? '#1C1917'
                      : 'rgba(255,255,255,0.3)',
                }}
              >
                {item.status === 'done' ? '✓' : item.status === 'active' ? '⟳' : '○'}
              </div>
              <span
                className="text-[14px] transition-colors duration-300"
                style={{ color: item.status === 'done' ? 'white' : 'rgba(255,255,255,0.7)' }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 mt-8 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${barWidth}%`,
              background: 'linear-gradient(90deg, #161B26, #0284C7)',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse-star {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.92); }
        }
      `}</style>
    </section>
  )
}
