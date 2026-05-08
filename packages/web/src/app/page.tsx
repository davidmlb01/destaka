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
        <Logo size="md" href="/" vertical="Saúde" />
        <div className="flex items-center gap-6">
          <Link
            href="/verificar"
            className="text-[13px] font-medium transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Diagnóstico gratuito
          </Link>
          <Link
            href="/login"
            className="text-[13px] font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Entrar
          </Link>
        </div>
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

      {/* Hero */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-28 pb-20">
        <div className="max-w-xl w-full text-center">

          <Badge className="mb-10">Presença digital para profissionais de saúde</Badge>

          <h1
            className="font-display font-extrabold text-white mb-6"
            style={{ fontSize: 'clamp(38px, 6vw, 62px)', lineHeight: 1.05, letterSpacing: '-2px' }}
          >
            Seu consultório no<br />
            <span style={{ color: 'var(--accent)' }}>topo do Google.</span><br />
            No piloto automático.
          </h1>

          <p
            className="mb-8 mx-auto"
            style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', maxWidth: 480 }}
          >
            Quem te procura, te encontra.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/verificar"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-display font-bold text-[15px] transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 0 24px rgba(14,165,233,0.35)' }}
            >
              Diagnóstico gratuito do seu Google
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-display font-medium text-[15px] transition-all hover:brightness-110"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            >
              Já sou cliente
            </Link>
          </div>

          {/* Como funciona */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { step: '1', text: 'Conecte seu Google' },
              { step: '2', text: 'A gente otimiza tudo' },
              { step: '3', text: 'Pacientes te encontram' },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl px-4 py-5 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: 'var(--accent)' }}>
                  Passo {item.step}
                </span>
                <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Lead capture (teaser) */}
      <section className="relative z-10 px-6 pb-20">
        <div
          className="rounded-2xl p-8 mx-auto text-left"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: 460 }}
        >
          <p className="font-bold text-[16px] text-white mb-1">Quero ser avisado de novidades</p>
          <p className="text-[13px] mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Sem compromisso. Sem spam.
          </p>
          <TeaserForm />
        </div>
      </section>

      <Footer />
    </main>
  )
}
