import Link from 'next/link'

// ─── NAV ────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{ background: 'rgba(20,83,45,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[22px]" style={{ color: '#F59E0B', filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.4))' }}>✦</span>
          <span className="font-display font-extrabold text-[20px] text-white tracking-tight">
            Desta<span style={{ color: '#F59E0B' }}>ka</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
          <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
          <a href="#planos" className="hover:text-white transition-colors">Planos</a>
        </div>
        <Link
          href="/diagnostico"
          className="font-display font-bold text-[14px] px-5 py-2.5 rounded-xl transition-all"
          style={{ background: '#D97706', color: '#1C1917' }}
        >
          Diagnóstico grátis
        </Link>
      </div>
    </nav>
  )
}

// ─── HERO ───────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-20 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #14532D 0%, #0A2E18 100%)' }}
    >
      {/* Orbs */}
      <div className="absolute rounded-full pointer-events-none blur-[140px]" style={{ width: 600, height: 600, background: 'rgba(217,119,6,0.16)', top: -200, right: -200 }} />
      <div className="absolute rounded-full pointer-events-none blur-[100px]" style={{ width: 350, height: 350, background: 'rgba(22,163,74,0.10)', bottom: -80, left: -100 }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 520, height: 520, border: '1px solid rgba(217,119,6,0.12)', top: -160, right: -160 }} />

      <div className="max-w-3xl w-full text-center relative z-10">

        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-[11px] font-bold tracking-[1.8px] uppercase"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }}
        >
          <span style={{ color: '#F59E0B' }}>✦</span>
          Para dentistas e médicos que merecem aparecer primeiro
        </div>

        <h1
          className="font-display font-extrabold text-white leading-[1.05] tracking-[-2.5px] mb-6"
          style={{ fontSize: 'clamp(40px, 6vw, 68px)' }}
        >
          Sua clínica deveria<br />
          aparecer primeiro.<br />
          <em className="not-italic" style={{ color: '#F59E0B' }}>A gente faz isso acontecer.</em>
        </h1>

        <p
          className="text-[18px] leading-relaxed mb-10 max-w-2xl mx-auto"
          style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(16px, 2vw, 19px)' }}
        >
          O Google decide quem seu paciente vai ligar.<br />
          A Destaka decide o que o Google vai ver.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/diagnostico"
            className="font-display font-extrabold text-[16px] px-8 py-4 rounded-xl flex items-center gap-2 transition-all"
            style={{ background: '#D97706', color: '#1C1917', boxShadow: '0 6px 32px rgba(217,119,6,0.45)' }}
          >
            <span>✦</span> Ver a nota do meu perfil
          </Link>
          <a
            href="#planos"
            className="font-body font-medium text-[15px] px-6 py-4 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Ver planos e preços
          </a>
        </div>

        <p className="mt-5 text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Diagnóstico gratuito. Sem cadastro. Resultado em 30 segundos.
        </p>
      </div>
    </section>
  )
}

// ─── STATS BAR ──────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { num: '46%', label: 'das buscas no Google têm intenção local' },
    { num: '76%', label: 'resultam em contato no mesmo dia' },
    { num: '88%', label: 'confiam em avaliações como indicação pessoal' },
    { num: '3x', label: 'mais pacientes com perfil otimizado' },
  ]
  return (
    <section style={{ background: '#FFFBEB', borderTop: '1px solid #FDE68A', borderBottom: '1px solid #FDE68A' }}>
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.num} className="text-center">
            <div className="font-display font-extrabold text-[32px] tracking-[-1px]" style={{ color: '#D97706' }}>{s.num}</div>
            <div className="text-[13px] leading-tight mt-1" style={{ color: '#78716C' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── PROBLEMA ───────────────────────────────────────────────────────────────

function Problema() {
  return (
    <section className="px-6 py-24" style={{ background: '#FAFAF9' }}>
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: '#D97706' }}>
              O problema real
            </p>
            <h2
              className="font-display font-extrabold leading-[1.1] tracking-[-1.5px] mb-6"
              style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#1C1917' }}
            >
              Você não perde pacientes<br />
              por falta de competência.
            </h2>
            <p className="text-[17px] leading-relaxed mb-6" style={{ color: '#57534E' }}>
              Perde porque eles não te encontram.
            </p>
            <p className="text-[16px] leading-relaxed" style={{ color: '#78716C' }}>
              O dentista que aparece em primeiro não é necessariamente o melhor. É o mais visível. Quando alguém digita "dentista perto de mim", o Google decide quem aparece. E na maioria das vezes, não é quem merece mais.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { icon: '🔍', title: 'O paciente pesquisa', desc: 'Todo dia, dezenas de pessoas na sua cidade buscam pelo profissional que você é. O Google escolhe quem mostrar.' },
              { icon: '📉', title: 'Perfis incompletos são penalizados', desc: '51% dos perfis no Google estão incompletos. Cada campo vazio é uma penalidade silenciosa que você nunca vai ver.' },
              { icon: '🏥', title: 'O concorrente aparece', desc: 'Não porque atende melhor. Porque o perfil está otimizado. Fotos atualizadas, posts recentes, avaliações respondidas.' },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-5 rounded-2xl"
                style={{ background: '#fff', border: '1px solid #E7E5E4', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <span className="text-[24px] flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-display font-bold text-[15px] mb-1" style={{ color: '#1C1917' }}>{item.title}</p>
                  <p className="text-[14px] leading-relaxed" style={{ color: '#78716C' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── COMO FUNCIONA ──────────────────────────────────────────────────────────

function ComoFunciona() {
  const steps = [
    {
      num: '01',
      title: 'Diagnóstico gratuito',
      desc: 'Em 30 segundos, a Destaka analisa seu perfil no Google e gera uma nota de 0 a 100. Você vê exatamente onde está perdendo visibilidade.',
      cta: 'Ver minha nota agora',
      href: '/diagnostico',
    },
    {
      num: '02',
      title: 'Conecte seu Google',
      desc: 'Um clique para autorizar. A Destaka acessa seu Google Meu Negócio e começa a trabalhar. Sem formulários complicados, sem configuração técnica.',
      cta: null,
      href: null,
    },
    {
      num: '03',
      title: 'A Destaka cuida de tudo',
      desc: 'Posts semanais gerados com IA, respostas automáticas para avaliações, sugestões de fotos, serviços otimizados. Você cuida dos pacientes. A Destaka cuida do Google.',
      cta: null,
      href: null,
    },
  ]

  return (
    <section id="como-funciona" className="px-6 py-24" style={{ background: '#1C1917' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: '#D97706' }}>Como funciona</p>
          <h2
            className="font-display font-extrabold text-white leading-[1.1] tracking-[-1.5px]"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
          >
            Em 5 minutos, seu perfil<br />já está sendo otimizado.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="relative p-7 rounded-2xl flex flex-col gap-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="font-display font-extrabold text-[48px] leading-none tracking-[-2px]"
                style={{ color: '#D97706' }}
              >
                {step.num}
              </div>
              <div>
                <h3 className="font-display font-bold text-[20px] text-white mb-2">{step.title}</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{step.desc}</p>
              </div>
              {step.cta && step.href && (
                <Link
                  href={step.href}
                  className="mt-auto font-display font-bold text-[14px] px-5 py-3 rounded-xl self-start transition-all"
                  style={{ background: '#D97706', color: '#1C1917' }}
                >
                  {step.cta} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── RECURSOS ───────────────────────────────────────────────────────────────

function Recursos() {
  const features = [
    { icon: '📊', title: 'Diagnóstico de perfil', desc: 'Score 0-100 em 6 categorias. Você sabe exatamente onde está perdendo visibilidade e o que precisa mudar.' },
    { icon: '📝', title: 'Posts automáticos', desc: 'Conteúdo gerado com IA em português nativo, com contexto da sua especialidade e cidade. Publicado semanalmente sem você precisar fazer nada.' },
    { icon: '⭐', title: 'Respostas a avaliações', desc: 'Cada nova avaliação recebe uma resposta personalizada e gentil. Automaticamente. Inclusive as de uma estrela, que são as mais importantes.' },
    { icon: '🖼️', title: 'Sugestão de fotos', desc: 'A Destaka indica exatamente quais fotos estão faltando e com qual frequência atualizar. Perfis com fotos recebem 42% mais pedidos de rota.' },
    { icon: '🏷️', title: 'Serviços otimizados', desc: 'Cadastro completo dos seus serviços com as palavras-chave que seus pacientes usam para buscar. Consultórios similares têm em média 11 serviços cadastrados.' },
    { icon: '📈', title: 'Relatório mensal', desc: 'Visibilidade completa do que foi feito, o que melhorou e qual impacto nas buscas. Tudo em português, sem jargão técnico.' },
  ]

  return (
    <section id="recursos" className="px-6 py-24" style={{ background: '#fff' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: '#D97706' }}>O que a Destaka faz</p>
          <h2
            className="font-display font-extrabold leading-[1.1] tracking-[-1.5px] mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#1C1917' }}
          >
            Tudo que uma agência faria.<br />
            <span style={{ color: '#14532D' }}>Sem reunião. Sem espera. Sem mensalidade de agência.</span>
          </h2>
          <p className="text-[17px] max-w-2xl mx-auto" style={{ color: '#78716C' }}>
            A Destaka cuida do Google enquanto você cuida dos pacientes. Cada um no que sabe fazer melhor.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl flex gap-4 transition-all"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
            >
              <span className="text-[28px] flex-shrink-0">{f.icon}</span>
              <div>
                <h3 className="font-display font-bold text-[16px] mb-1.5" style={{ color: '#14532D' }}>{f.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: '#57534E' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PRICING ────────────────────────────────────────────────────────────────

function Pricing() {
  const plans = [
    {
      name: 'Essencial',
      price: 'R$147',
      period: '/mês',
      desc: 'Para quem quer começar a aparecer no Google sem complicação.',
      features: [
        '1 perfil Google Meu Negócio',
        'Diagnóstico mensal completo',
        'Monitoramento de avaliações',
        'Sugestões de otimização',
        'Relatório mensal',
      ],
      cta: 'Começar agora',
      highlight: false,
    },
    {
      name: 'Pro',
      price: 'R$197',
      period: '/mês',
      desc: 'Para quem quer crescimento consistente e automatizado.',
      features: [
        '1 perfil Google Meu Negócio',
        'Diagnóstico semanal',
        'Posts automáticos semanais',
        'Respostas automáticas a avaliações',
        'Relatório PDF mensal',
      ],
      cta: 'Escolher Pro',
      highlight: true,
    },
    {
      name: 'Agência',
      price: 'R$497',
      period: '/mês',
      desc: 'Para clínicas com múltiplas unidades ou agências de saúde.',
      features: [
        'Até 10 perfis Google Meu Negócio',
        'Tudo do plano Pro',
        'Dashboard multi-cliente',
        'White label disponível',
        'Suporte prioritário',
      ],
      cta: 'Falar com vendas',
      highlight: false,
    },
  ]

  return (
    <section id="planos" className="px-6 py-24" style={{ background: '#FAFAF9' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: '#D97706' }}>Planos</p>
          <h2
            className="font-display font-extrabold leading-[1.1] tracking-[-1.5px] mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#1C1917' }}
          >
            R$147/mês por 3 novos pacientes.<br />
            <span style={{ color: '#14532D' }}>As contas fecham sozinhas.</span>
          </h2>
          <p className="text-[16px]" style={{ color: '#78716C' }}>
            Um horário vago na sua agenda tem um custo. A Destaka existe para esse horário nunca ficar vago por falta de visibilidade.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl p-7 flex flex-col gap-5 relative"
              style={plan.highlight ? {
                background: '#14532D',
                boxShadow: '0 24px 64px rgba(20,83,45,0.3)',
                border: '1px solid rgba(217,119,6,0.4)',
              } : {
                background: '#fff',
                border: '1px solid #E7E5E4',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              {plan.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase"
                  style={{ background: '#D97706', color: '#1C1917' }}
                >
                  Mais popular
                </div>
              )}

              <div>
                <h3
                  className="font-display font-bold text-[16px] mb-1"
                  style={{ color: plan.highlight ? 'rgba(255,255,255,0.6)' : '#57534E' }}
                >
                  {plan.name}
                </h3>
                <div className="flex items-end gap-1">
                  <span
                    className="font-display font-extrabold tracking-[-2px]"
                    style={{ fontSize: 48, lineHeight: 1, color: plan.highlight ? '#FCD34D' : '#14532D' }}
                  >
                    {plan.price}
                  </span>
                  <span className="pb-1 text-[14px]" style={{ color: plan.highlight ? 'rgba(255,255,255,0.4)' : '#9CA3AF' }}>
                    {plan.period}
                  </span>
                </div>
                <p className="text-[14px] mt-2" style={{ color: plan.highlight ? 'rgba(255,255,255,0.5)' : '#78716C' }}>
                  {plan.desc}
                </p>
              </div>

              <ul className="flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px]">
                    <span className="mt-0.5 flex-shrink-0" style={{ color: plan.highlight ? '#FCD34D' : '#16A34A' }}>✓</span>
                    <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.8)' : '#57534E' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/diagnostico"
                className="mt-auto w-full text-center font-display font-bold text-[15px] py-3.5 rounded-xl transition-all"
                style={plan.highlight ? {
                  background: '#D97706',
                  color: '#1C1917',
                  boxShadow: '0 4px 20px rgba(217,119,6,0.4)',
                } : {
                  background: '#F0FDF4',
                  color: '#14532D',
                  border: '1px solid #BBF7D0',
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[13px] mt-8" style={{ color: '#9CA3AF' }}>
          Todos os planos incluem 14 dias grátis. Sem cartão de crédito no teste.
        </p>
      </div>
    </section>
  )
}

// ─── MANIFESTO ──────────────────────────────────────────────────────────────

function Manifesto() {
  return (
    <section
      className="px-6 py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #14532D 0%, #0A2E18 100%)' }}
    >
      <div className="absolute rounded-full pointer-events-none blur-[120px]" style={{ width: 500, height: 500, background: 'rgba(217,119,6,0.12)', top: -150, right: -150 }} />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <span
          className="text-[40px] block mb-8"
          style={{ color: '#F59E0B', filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.4))' }}
        >
          ✦
        </span>

        <h2
          className="font-display font-extrabold text-white leading-[1.15] tracking-[-1.5px] mb-10"
          style={{ fontSize: 'clamp(24px, 4vw, 38px)' }}
        >
          Você passou anos se formando.<br />
          Fez especialização. Aprendeu a cuidar<br />
          de pessoas melhor do que qualquer um na sua rua.
        </h2>

        <div className="text-left max-w-xl mx-auto space-y-5 mb-12">
          {[
            'E hoje, quando alguém digita "dentista perto de mim", aparece o consultório do lado. O que faz menos. O que cobra mais caro. O que tem metade da sua experiência.',
            'Não é injusto. É técnico. O Google não conhece você. Ainda.',
            'A Destaka existe para isso. Para traduzir a sua competência em linguagem que o algoritmo entende. Para fazer o invisível aparecer.',
            'Para garantir que, quando o paciente certo estiver buscando, ele vai te encontrar primeiro.',
          ].map((text, i) => (
            <p
              key={i}
              className="text-[17px] leading-relaxed"
              style={{ color: i === 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)' }}
            >
              {text}
            </p>
          ))}
        </div>

        <p
          className="font-display font-bold text-[18px] mb-10"
          style={{ color: '#FCD34D' }}
        >
          Quem cuida de pessoas não deveria perder<br />por causa de burocracia digital.
        </p>

        <Link
          href="/diagnostico"
          className="inline-flex items-center gap-2 font-display font-extrabold text-[16px] px-8 py-4 rounded-xl transition-all"
          style={{ background: '#D97706', color: '#1C1917', boxShadow: '0 6px 32px rgba(217,119,6,0.45)' }}
        >
          <span>✦</span> Descobrir minha nota no Google
        </Link>

        <p className="mt-5 text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Grátis. Sem cadastro. Resultado em 30 segundos.
        </p>
      </div>
    </section>
  )
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="px-6 py-10" style={{ background: '#1C1917', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[18px]" style={{ color: '#F59E0B' }}>✦</span>
          <span className="font-display font-extrabold text-[16px] text-white tracking-tight">
            Desta<span style={{ color: '#F59E0B' }}>ka</span>
          </span>
        </div>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Google Business Profile no piloto automático. Para dentistas e médicos que merecem aparecer primeiro.
        </p>
        <div className="flex items-center gap-5">
          <Link href="/privacidade" className="text-[12px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Privacidade
          </Link>
          <Link href="/termos" className="text-[12px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Termos
          </Link>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
            © 2026 Destaka
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── PAGE ───────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <StatsBar />
      <Problema />
      <ComoFunciona />
      <Recursos />
      <Pricing />
      <Manifesto />
      <Footer />
    </>
  )
}
