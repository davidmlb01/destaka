'use client'

import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1117 50%, #0a0a0a 100%)' }}
    >
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>
        <h1
          className="font-display font-extrabold text-white mb-3"
          style={{ fontSize: 32, letterSpacing: '-0.5px' }}
        >
          Algo deu errado
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 32 }}>
          Estamos resolvendo. Tente novamente.
        </p>
        <Button variant="green" size="md" onClick={reset}>
          Tentar novamente
        </Button>
      </div>
    </main>
  )
}
