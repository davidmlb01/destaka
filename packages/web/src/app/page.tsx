import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Badge } from '@/components/ui/Badge'
import { TeaserForm } from './teaser-form'

function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-5"
      style={{ background: 'rgba(15,17,23,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Logo size="md" href="/" />
        <span className="text-[12px] font-semibold tracking-[1px] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Em breve
        </span>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="text-center py-8 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-center gap-6 text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
        <span>© 2026 Destaka</span>
        <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
        <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <main
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: '#0F1117', color: '#fff' }}
    >
      {/* Orbs */}
      <div className="fixed rounded-full pointer-events-none" style={{ width: 700, height: 700, background: 'radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)', top: -300, right: -200 }} />
      <div className="fixed rounded-full pointer-events-none" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)', bottom: -100, left: -100 }} />

      <Nav />

      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-28 pb-20">
        <div className="max-w-xl w-full text-center">

          <Badge className="mb-10">Lançamento em breve para profissionais de saúde</Badge>

          <h1
            className="font-extrabold text-white mb-6"
            style={{ fontSize: 'clamp(38px, 6vw, 62px)', lineHeight: 1.05, letterSpacing: '-2px' }}
          >
            Seu consultório no<br />
            <span style={{ color: 'var(--accent)' }}>topo do Google.</span><br />
            No piloto automático.
          </h1>

          <p
            className="mb-12 mx-auto"
            style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', maxWidth: 480 }}
          >
            Você cuida dos seus pacientes.<br />
            A gente cuida do Google pra você.
          </p>

          <div
            className="rounded-2xl p-8 mx-auto text-left"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: 460 }}
          >
            <p className="font-bold text-[16px] text-white mb-1">Quero ser um dos primeiros</p>
            <p className="text-[13px] mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Vagas limitadas para o piloto. Sem compromisso.
            </p>
            <TeaserForm />
            <p className="text-[12px] text-center mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Nada de spam. Você será avisado quando abrirmos as vagas.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mt-8 text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Primeiros 30 profissionais com condições especiais de lançamento
          </div>

        </div>
      </section>

      <Footer />
    </main>
  )
}
