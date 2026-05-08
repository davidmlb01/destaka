import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

const VERTICALS = [
  { name: 'Saúde', desc: 'Médicos, dentistas e profissionais de saúde', color: '#0EA5E9', href: '/saude/verificar', status: 'ativo' },
  { name: 'Pet', desc: 'Veterinários e clínicas veterinárias', color: '#22C55E', href: '#', status: 'em breve' },
  { name: 'Jurídico', desc: 'Advogados e escritórios de advocacia', color: '#60A5FA', href: '#', status: 'em breve' },
] as const

function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-5"
      style={{ background: 'rgba(15,17,23,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Logo size="md" href="/" />
        <div className="flex items-center gap-6">
          <Link
            href="/saude/verificar"
            className="text-[13px] font-medium transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Diagnóstico gratuito
          </Link>
          <Link
            href="/saude/login"
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
    <footer className="text-center py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-5xl mx-auto">
        <Logo size="sm" className="justify-center mb-4" />
        <p className="text-[12px] mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Quem te procura, te encontra.
        </p>
        <div className="flex items-center justify-center gap-6 text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <span>© 2026 Destaka</span>
          <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-x-hidden" style={{ background: '#0F1117', color: '#fff' }}>
      {/* Orb decorativo */}
      <div className="fixed rounded-full pointer-events-none" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)', top: -250, right: -200 }} />

      <Nav />

      {/* Hero */}
      <section className="relative z-10 pt-36 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="font-display font-bold text-white mb-6"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.1, letterSpacing: '-1.5px' }}
          >
            Presença digital para<br />
            profissionais liberais.
          </h1>
          <p
            className="mx-auto mb-4"
            style={{ fontSize: 20, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)', maxWidth: 520 }}
          >
            Quem te procura, te encontra.
          </p>
          <p
            className="mx-auto mb-12"
            style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.35)', maxWidth: 480 }}
          >
            O software que faz o profissional liberal ser encontrado, escolhido e lembrado no Google. No piloto automático.
          </p>
          <Link
            href="#verticais"
            className="inline-flex items-center gap-2 text-[14px] font-semibold transition-colors hover:text-white"
            style={{ color: 'var(--accent)' }}
          >
            Encontre seu vertical ↓
          </Link>
        </div>
      </section>

      {/* Verticais */}
      <section id="verticais" className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p
            className="text-[11px] font-bold tracking-[0.15em] uppercase mb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Verticais
          </p>
          <h2
            className="font-display font-semibold text-white mb-10"
            style={{ fontSize: 28, letterSpacing: '-0.5px' }}
          >
            Cada profissional tem sua lógica. Cada vertical entende a sua.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {VERTICALS.map((v) => (
              <Link
                key={v.name}
                href={v.href}
                className="group rounded-xl p-6 transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Pin mark na cor do vertical */}
                <svg width="28" height="33" viewBox="0 0 72 84" fill="none" className="mb-4">
                  <path
                    fillRule="evenodd"
                    d="M36 5C50.91 5 63 17.09 63 32C63 43.5 56.4 51.7 49.6 59.6C44.5 65.55 39.6 71.2 36 76C32.4 71.2 27.5 65.55 22.4 59.6C15.6 51.7 9 43.5 9 32C9 17.09 21.09 5 36 5Z M19.5 32C24 24.5 30 21 36 21C42 21 48 24.5 52.5 32C48 39.5 42 43 36 43C30 43 24 39.5 19.5 32Z"
                    fill={v.color}
                  />
                  <circle cx="36" cy="32" r="4.2" fill={v.color} />
                </svg>

                <h3 className="font-display font-semibold text-white text-[18px] mb-1">
                  Destaka <span style={{ fontWeight: 300, opacity: 0.5 }}>{v.name}</span>
                </h3>
                <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  {v.desc}
                </p>

                {v.status === 'ativo' ? (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase"
                    style={{ color: v.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: v.color }} />
                    Ativo
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Em breve
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p
            className="text-[11px] font-bold tracking-[0.15em] uppercase mb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Por que existimos
          </p>
          <div className="space-y-5" style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(255,255,255,0.6)' }}>
            <p>
              Tem um dentista no seu bairro que é provavelmente o melhor da cidade. Você não sabe disso. O Google também não.
            </p>
            <p>
              Ele atende há 15 anos, tem pacientes que trazem os filhos e os netos. Mas o perfil dele no Google tem uma foto de 2019, horário errado e zero avaliações recentes. Quando alguém pesquisa &quot;dentista perto de mim&quot;, ele não aparece.
            </p>
            <p>
              Isso não é justo. Mas é assim que funciona.
            </p>
            <p>
              O profissional liberal brasileiro construiu carreira cuidando de pessoas. Não estudou marketing. Não deveria precisar estudar. O consultório, o escritório, a clínica deveriam ser encontrados pela competência real que entregam.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.85)' }}>
              Destaka nasceu dessa premissa: presença digital não pode depender de você virar marqueteiro. Precisa funcionar como infraestrutura. Silenciosa, confiável, no piloto automático.
            </p>
          </div>
          <p className="mt-8 text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            David Levy, fundador
          </p>
        </div>
      </section>

      {/* Como pensamos */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p
            className="text-[11px] font-bold tracking-[0.15em] uppercase mb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Como funciona
          </p>
          <h2
            className="font-display font-semibold text-white mb-10"
            style={{ fontSize: 28, letterSpacing: '-0.5px' }}
          >
            Três passos. Zero complexidade.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: '01', title: 'Conecte seu Google', desc: 'Vincule seu Perfil de Empresa do Google em 2 minutos. Setup único.' },
              { step: '02', title: 'A gente otimiza tudo', desc: 'Posts, avaliações, fotos, informações. Tudo atualizado e otimizado por IA.' },
              { step: '03', title: 'Pacientes te encontram', desc: 'Seu perfil sobe no ranking. Quem te procura, te encontra.' },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl p-6"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-[12px] font-bold tracking-wider" style={{ color: 'var(--accent)' }}>
                  {item.step}
                </span>
                <h3 className="font-display font-semibold text-white text-[16px] mt-2 mb-2">
                  {item.title}
                </h3>
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 py-20 px-6 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="font-display font-semibold text-white text-[24px] mb-4" style={{ letterSpacing: '-0.5px' }}>
            Competência visível.
          </h2>
          <p className="text-[15px] mb-8" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            Descubra como está seu perfil no Google. Diagnóstico gratuito em 2 minutos.
          </p>
          <Link
            href="/saude/verificar"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-display font-bold text-[15px] transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 0 24px rgba(14,165,233,0.35)' }}
          >
            Fazer diagnóstico gratuito
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
