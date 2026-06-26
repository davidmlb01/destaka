import Link from 'next/link'

const teal = '#14B8A6'
const bg = '#071a19'
const bgCard = '#0d2b29'
const bgCardBorder = '#1a3d3a'

export default function LandingPage() {
  return (
    <main style={{ background: bg, color: '#fff', fontFamily: 'var(--font-geist-sans)' }}>

      {/* NAVBAR */}
      <nav style={{ background: bg, borderBottom: `1px solid ${bgCardBorder}` }}
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={teal}/>
            <circle cx="12" cy="9" r="2.5" fill={bg}/>
          </svg>
          <span className="font-bold text-lg tracking-tight">
            Destaka <span style={{ color: teal }} className="text-sm font-semibold">SAÚDE</span>
          </span>
        </div>
        <Link href="/login"
          style={{ border: `1px solid ${teal}`, color: teal }}
          className="px-5 py-2 rounded-full text-sm font-medium hover:opacity-80 transition-opacity">
          Entrar
        </Link>
      </nav>

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div style={{ background: bgCard, border: `1px solid ${bgCardBorder}`, color: teal }}
          className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-8">
          Piloto automático para o seu Google
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Quem te procura,<br />te encontra.
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Para dentistas e médicos que querem aparecer no Google sem virar marqueteiro.
          O Destaka cuida do seu perfil — você cuida dos seus pacientes.
        </p>
        <Link href="/login"
          style={{ background: teal }}
          className="inline-block px-8 py-4 rounded-full text-white font-semibold text-lg hover:opacity-90 transition-opacity">
          Começar agora — grátis
        </Link>
        <p className="text-sm text-white/40 mt-4">
          Sem cartão de crédito. Conecte sua conta Google em 2 minutos.
        </p>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Tudo que seu perfil precisa, no automático</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '⭐',
              title: 'Avaliações com IA',
              desc: 'Monitoramos cada nova avaliação e geramos respostas personalizadas. Você revisa e publica com um clique.',
            },
            {
              icon: '✏️',
              title: '3 Posts por semana',
              desc: 'Conteúdo educativo gerado automaticamente para o seu perfil. Sem copiar de concorrente, sem repetir.',
            },
            {
              icon: '📊',
              title: 'Score Destaka',
              desc: 'Acompanhe sua visibilidade no Google e receba recomendações prioritizadas para subir no ranking local.',
            },
          ].map((f) => (
            <div key={f.title}
              style={{ background: bgCard, border: `1px solid ${bgCardBorder}` }}
              className="p-6 rounded-2xl">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Como funciona</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Conecte seu perfil', desc: 'OAuth Google em 2 minutos. Sem senha, sem complicação.' },
            { step: '02', title: 'Configuramos tudo', desc: 'Analisamos seu perfil atual e montamos sua estratégia de visibilidade.' },
            { step: '03', title: 'Cresce no automático', desc: 'Avaliações respondidas, posts publicados, score monitorado — sem você fazer nada.' },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div style={{ color: teal }} className="text-4xl font-bold mb-3">{s.step}</div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-md mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-10">Simples e transparente</h2>
        <div style={{ background: bgCard, border: `1px solid ${teal}` }} className="p-8 rounded-2xl">
          <div style={{ color: teal }} className="text-sm font-semibold mb-1">Destaka Saúde</div>
          <div className="text-4xl font-bold mb-1">R$ 197</div>
          <div className="text-white/50 text-sm mb-6">/mês</div>
          <ul className="text-left space-y-3 mb-8 text-sm text-white/80">
            {[
              'Monitoramento de avaliações',
              '3 posts semanais com IA',
              'Score de visibilidade',
              'Relatório mensal',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span style={{ color: teal }}>✓</span> {item}
              </li>
            ))}
          </ul>
          <Link href="/login"
            style={{ background: teal }}
            className="block w-full py-3 rounded-full font-semibold text-white hover:opacity-90 transition-opacity">
            Começar agora
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${bgCardBorder}` }} className="px-6 py-10 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
          <span>Destaka — by UNLMTD Co Producoes Ltda</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white/70 transition-colors">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-white/70 transition-colors">Termos de Uso</Link>
            <Link href="/login" className="hover:text-white/70 transition-colors">Entrar</Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-4 text-xs text-white/25 text-center md:text-left">
          © 2025 UNLMTD Co Producoes Ltda. CNPJ 33.838.440/0001-71. Todos os direitos reservados.
        </div>
      </footer>

    </main>
  )
}
