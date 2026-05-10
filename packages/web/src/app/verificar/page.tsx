import { Logo } from '@/components/ui/Logo'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { VerifyTool } from '@/components/verificar/VerifyTool'

export const metadata = {
  title: 'Diagnóstico GMB Gratuito — Destaka',
  description: 'Cole o link do Google Maps de qualquer clínica ou consultório e veja o score de visibilidade em segundos.',
}

export default function VerificarPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Orbs decorativos */}
      <div
        className="fixed pointer-events-none blur-[160px] rounded-full"
        style={{ width: 600, height: 600, background: 'rgba(14,165,233,0.09)', top: -200, right: -200 }}
      />
      <div
        className="fixed pointer-events-none blur-[140px] rounded-full"
        style={{ width: 400, height: 400, background: 'rgba(74,222,128,0.05)', bottom: -100, left: -100 }}
      />

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-4xl mx-auto">
        <Logo size="sm" href="/" />
        <Button variant="ghost" size="sm" href="/login">
          Entrar na plataforma
        </Button>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 px-6 pb-20 max-w-4xl mx-auto">

        {/* Hero */}
        <div className="text-center pt-8 pb-10">
          <Badge variant="subtle" className="mb-5">Diagnóstico gratuito</Badge>

          <h1
            className="font-display font-extrabold text-white mb-4"
            style={{ fontSize: 'clamp(28px, 5vw, 42px)', letterSpacing: '-0.5px', lineHeight: 1.12 }}
          >
            Descubra o score de visibilidade<br />de qualquer negócio no Google
          </h1>

          <p
            className="text-base max-w-md mx-auto"
            style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}
          >
            Cole o link do Google Maps, receba uma análise completa em segundos. Sem cadastro, sem login.
          </p>
        </div>

        <VerifyTool />
      </main>
    </div>
  )
}
