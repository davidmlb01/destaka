import Link from 'next/link'
import type { Metadata } from 'next'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

export const metadata: Metadata = {
  title: 'Destaka: seu perfil no Google trabalhando por você',
  description:
    'Google Meu Negócio no piloto automático para negócios locais. Diagnóstico gratuito do seu perfil em 30 segundos.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Destaka: seu perfil no Google trabalhando por você',
    description:
      'Google Meu Negócio no piloto automático para negócios locais. Diagnóstico gratuito em 30 segundos.',
    url: SITE_URL,
    siteName: 'Destaka',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Destaka: seu perfil no Google trabalhando por você',
    description:
      'Google Meu Negócio no piloto automático para negócios locais. Diagnóstico gratuito em 30 segundos.',
  },
}

// FAQ DATA

const FAQ_ITEMS = [
  { q: 'Preciso dar acesso ao meu Google?', a: 'Sim, conexão segura via OAuth oficial do Google. Não armazenamos sua senha.' },
  { q: 'Tem contrato ou fidelidade?', a: 'Não. Cancele quando quiser, sem multa. E se seu score não subir pelo menos 15 pontos em 30 dias, devolvemos 100% do valor.' },
  { q: 'Funciona na minha cidade?', a: 'Sim, funciona em qualquer cidade do Brasil.' },
  { q: 'Quanto tempo para ver resultado?', a: 'Seu perfil começa a ser otimizado em minutos. Resultados visíveis nas buscas em 2 a 4 semanas.' },
  { q: 'Já uso outras plataformas. Preciso do Destaka?', a: 'São complementares. Plataformas são marketplaces. O Google Meu Negócio é onde 46% das buscas locais acontecem. O Destaka otimiza seu perfil lá.' },
  { q: 'É seguro?', a: '100%. Conexão via API oficial do Google. Dados protegidos. Conformidade LGPD.' },
]

// SCHEMA

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Destaka',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Google Meu Negócio no piloto automático para negócios locais. Otimização automática do perfil comercial no Google.',
  url: SITE_URL,
  offers: {
    '@type': 'Offer',
    price: '197',
    priceCurrency: 'BRL',
    priceValidUntil: '2027-12-31',
    availability: 'https://schema.org/InStock',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Destaka',
    url: SITE_URL,
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

// HELPERS

function PinIcon({ size = 24, color = 'var(--accent)', bg = 'var(--bg-base)' }: { size?: number; color?: string; bg?: string }) {
  const h = Math.round(size * (160 / 120))
  return (
    <svg width={size} height={h} viewBox="0 0 120 160" fill="none" className="flex-shrink-0">
      <path d="M60 6C32.4 6 10 28.4 10 56C10 76 20 90 32 102C42 112 52 122 60 132C68 122 78 112 88 102C100 90 110 76 110 56C110 28.4 87.6 6 60 6Z" fill={color}/>
      <path d="M26 56C36 43 47 38 60 38C73 38 84 43 94 56C84 69 73 74 60 74C47 74 36 69 26 56Z" fill={bg}/>
      <circle cx="60" cy="56" r="7" fill={color}/>
    </svg>
  )
}

// NAV

function Nav() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 px-6 pointer-events-none">
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto flex items-center gap-6 rounded-full px-4 py-2.5"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Logo size="md" href="/" />
        <div className="hidden md:flex items-center gap-6 text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.68)' }}>
          <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
          <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
        </div>
        <Button variant="primary" size="sm" href="/login">
          Entrar
        </Button>
      </nav>
    </div>
  )
}

// HERO

function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex items-center px-6 pt-28 pb-24 overflow-hidden"
      style={{ background: 'var(--bg-gradient)', minHeight: 'clamp(600px, 100dvh, 900px)' }}
    >
      <div className="absolute pointer-events-none" style={{ inset: 0, background: 'radial-gradient(ellipse 60% 50% at 80% -10%, rgba(20,184,166,0.10) 0%, transparent 70%)' }} />
      <div className="absolute pointer-events-none" style={{ inset: 0, background: 'radial-gradient(ellipse 40% 40% at -5% 110%, rgba(20,184,166,0.06) 0%, transparent 70%)' }} />

      <div className="max-w-5xl mx-auto w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-14 md:gap-16 items-center">

          <div>
            <Badge className="mb-6">
              Para quem merece ser encontrado primeiro
            </Badge>

            <h1
              id="hero-heading"
              className="font-display font-bold text-white leading-[1.08] tracking-[-1.5px] mb-6"
              style={{ fontSize: 'clamp(34px, 4.5vw, 56px)' }}
            >
              Seu cliente está no Google agora, procurando o que você faz.<br />
              <em className="not-italic" style={{ color: 'var(--accent)' }}>Ele vai te encontrar?</em>
            </h1>

            <p
              className="leading-relaxed mb-4"
              style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(16px, 1.8vw, 18px)', lineHeight: 1.7 }}
            >
              O Google Meu Negócio decide quem aparece primeiro quando alguém busca perto de você. Para aparecer primeiro, seu perfil precisa ser o mais completo e o mais ativo da região.
            </p>

            <p
              className="mb-10"
              style={{ color: 'rgba(255,255,255,0.50)', fontSize: 'clamp(14px, 1.5vw, 16px)', lineHeight: 1.7 }}
            >
              Faça o diagnóstico gratuito e veja onde você está perdendo clientes.
            </p>

            <Button variant="primary" size="lg" href="/login">
              <PinIcon size={16} color="#fff" bg="var(--accent)" />
              Fazer diagnóstico gratuito
              <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 text-[13px]">→</span>
            </Button>

            <p className="mt-4 text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Grátis. Sem cartão de crédito. Resultado em 30 segundos.
            </p>

          </div>

          <div
            className="p-[2px] rounded-2xl"
            style={{ background: 'rgba(20,184,166,0.12)', boxShadow: '0 0 0 1px rgba(20,184,166,0.20)' }}
          >
            <div
              className="rounded-[14px] divide-y"
              style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(20,184,166,0.08)' }}
            >
              {[
                { pct: '46%', label: 'das buscas no Google são locais', desc: 'Se você não aparece, o concorrente do lado aparece.' },
                { pct: '76%', label: 'visitam o negócio no mesmo dia', desc: 'Quem busca um serviço perto tem urgência. Visibilidade é conversão.' },
                { pct: '88%', label: 'confiam em avaliações online', desc: 'Perfis sem resposta perdem credibilidade imediatamente.' },
              ].map((stat, i) => (
                <div
                  key={stat.pct}
                  className="flex gap-5 px-7 py-7"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', borderTopWidth: i > 0 ? 1 : 0 }}
                >
                  <div
                    className="font-display font-bold leading-none tracking-[-3px] flex-shrink-0 w-24 text-right"
                    style={{ fontSize: 52, color: '#14B8A6' }}
                  >
                    {stat.pct}
                  </div>
                  <div className="pt-1">
                    <p className="font-display font-bold text-[15px] text-white mb-1.5 leading-snug">{stat.label}</p>
                    <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>{stat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// CUSTO DA INVISIBILIDADE

function CustoDaInvisibilidade() {
  const impactos = [
    {
      titulo: 'Perfil fraco, negócio invisível',
      desc: 'Cada campo vazio e cada semana sem atividade empurram você para baixo. O Google mostra quem está otimizado.',
    },
    {
      titulo: 'Sem posts, sem relevância',
      desc: 'O Google prioriza perfis ativos. Sem posts recentes, o algoritmo entende que o negócio parou.',
    },
    {
      titulo: 'Avaliações ignoradas afastam',
      desc: 'Uma avaliação negativa sem resposta pesa mais do que dez positivas. O Google percebe, o cliente também.',
    },
  ]

  return (
    <section aria-label="O custo da invisibilidade" style={{ background: 'rgba(20,184,166,0.04)', borderTop: '1px solid rgba(20,184,166,0.15)', borderBottom: '1px solid rgba(20,184,166,0.15)' }}>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold tracking-[2px] uppercase mb-5" style={{ color: 'var(--accent)' }}>
            O custo da invisibilidade
          </p>
          <h2
            className="font-display font-bold text-white leading-[1.15] tracking-[-1px] mb-5"
            style={{ fontSize: 'clamp(24px, 3.5vw, 36px)' }}
          >
            Seu perfil está parado.<br className="hidden md:block" />
            O concorrente do lado, não.
          </h2>
          <p className="text-[16px] max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>
            O Google Meu Negócio não é uma vitrine opcional. É onde o seu cliente decide entre você e o concorrente, antes de ligar, antes de visitar, antes de qualquer outra coisa.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {impactos.map((item) => (
            <div
              key={item.titulo}
              className="p-[2px] rounded-2xl"
              style={{ background: 'rgba(20,184,166,0.10)', boxShadow: '0 0 0 1px rgba(20,184,166,0.22)' }}
            >
              <div
                className="rounded-[14px] p-8 h-full flex flex-col"
                style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(20,184,166,0.10)' }}
              >
                <PinIcon size={28} />
                <h3 className="font-display font-bold text-[16px] text-white mb-3 mt-5">{item.titulo}</h3>
                <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="p-[2px] rounded-2xl max-w-2xl mx-auto mb-14"
          style={{ background: 'rgba(20,184,166,0.10)', boxShadow: '0 0 0 1px rgba(20,184,166,0.22)' }}
        >
          <div
            className="rounded-[14px] p-8 text-center"
            style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(20,184,166,0.10)' }}
          >
            <p className="text-[16px] leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Perfis com Destaka recebem até
            </p>
            <p className="font-display font-bold text-white tracking-[-1px] mb-2" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
              <span style={{ color: '#14B8A6' }}>7x mais cliques</span> no Google
            </p>
            <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Mais cliques, mais ligações, mais clientes na sua porta.
            </p>
          </div>
        </div>

        <div
          className="p-[2px] rounded-2xl max-w-2xl mx-auto mb-14"
          style={{ background: 'rgba(255,255,255,0.06)', boxShadow: '0 0 0 1px rgba(255,255,255,0.10)' }}
        >
          <div
            className="rounded-[14px] px-8 py-7 flex flex-col sm:flex-row items-center gap-5"
            style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)' }}
          >
            <div className="flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <p className="text-[15px] text-center sm:text-left" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
              <span className="font-display font-bold text-white">Garantia Destaka:</span> seu score sobe no mínimo 15 pontos em 30 dias. Se não subir, devolvemos 100% do valor. Sem perguntas.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button variant="primary" size="lg" href="/login">
            <PinIcon size={16} color="#fff" bg="var(--accent)" />
            Fazer diagnóstico gratuito
            <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 text-[13px]">→</span>
          </Button>
          <p className="mt-4 text-[14px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Descubra quanto seu perfil pode melhorar.
          </p>
        </div>
      </div>
    </section>
  )
}

// PROBLEMA

function Problema() {
  return (
    <section aria-labelledby="problema-heading" className="px-6 py-24" style={{ background: '#071a19' }}>
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              id="problema-heading"
              className="font-display font-bold leading-[1.1] tracking-[-1px] mb-6"
              style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#fff' }}
            >
              Você não perde clientes<br />
              por falta de qualidade.
            </h2>
            <p className="text-[17px] mb-6" style={{ color: 'rgba(255,255,255,0.70)', lineHeight: 1.7 }}>
              Perde porque o Google Meu Negócio não sabe que você existe.
            </p>
            <p className="text-[16px] mb-6" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>
              Quando alguém digita o que você faz seguido de &quot;perto de mim&quot;, o Google Meu Negócio decide quem aparece. Não é quem faz melhor. É quem tem o perfil mais completo, mais ativo, com mais avaliações respondidas. O resto fica invisível.
            </p>
            <p className="text-[15px] font-medium" style={{ color: 'var(--accent)', lineHeight: 1.7 }}>
              Neste momento, alguém perto de você está buscando exatamente o que você oferece. Se o seu perfil não aparece nos 3 primeiros, esse cliente já ligou para o concorrente do lado.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {[
              { title: 'O cliente pesquisa', desc: 'Todo dia, dezenas de pessoas perto de você buscam pelo que você faz. O Google Meu Negócio escolhe quem mostrar.' },
              { title: 'Perfis parados são enterrados', desc: 'O Google mede atividade. Sem posts, sem fotos, sem respostas, o algoritmo empurra você para baixo.' },
              { title: 'O concorrente do lado aparece', desc: 'Não porque faz melhor. Porque o perfil está otimizado. Fotos atualizadas, posts recentes, avaliações respondidas.' },
            ].map((item) => (
              <div
                key={item.title}
                className="p-[2px] rounded-2xl transition-transform duration-150 hover:-translate-y-1"
                style={{ background: 'rgba(255,255,255,0.06)', boxShadow: '0 0 0 1px rgba(255,255,255,0.10)' }}
              >
                <div
                  className="flex gap-4 p-6 rounded-[14px] h-full"
                  style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)' }}
                >
                  <PinIcon size={22} />
                  <div>
                    <p className="font-display font-bold text-[15px] mb-1.5 text-white">{item.title}</p>
                    <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// APARECER PRIMEIRO

function AparecerPrimeiro() {
  return (
    <section aria-label="Aparecer primeiro" style={{ background: 'rgba(20,184,166,0.04)', borderTop: '1px solid rgba(20,184,166,0.15)', borderBottom: '1px solid rgba(20,184,166,0.15)' }}>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-[auto_1fr] gap-12 items-center">
          <div
            className="font-display font-bold leading-none tracking-[-4px] text-center md:text-left"
            style={{ fontSize: 'clamp(72px, 10vw, 120px)', color: '#14B8A6' }}
          >
            1º
          </div>
          <div>
            <h2
              className="font-display font-bold text-white leading-[1.15] tracking-[-1px] mb-5"
              style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}
            >
              Você é o melhor no que faz.<br className="hidden md:block" />
              O Google só precisa saber disso.
            </h2>
            <p className="text-[16px] mb-8" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>
              O primeiro lugar no Google vai para quem tem o perfil mais completo, mais ativo, com mais avaliações. O Destaka cuida de tudo isso no piloto automático, para que o primeiro lugar seja seu.
            </p>
            <Button variant="primary" size="md" href="/login">
              Ver a nota do meu perfil →
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// MANIFESTO

function Manifesto() {
  return (
    <section
      aria-labelledby="manifesto-heading"
      className="px-6 py-28 relative overflow-hidden"
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div className="absolute pointer-events-none" style={{ inset: 0, background: 'radial-gradient(ellipse 50% 40% at 90% 0%, rgba(20,184,166,0.08) 0%, transparent 70%)' }} />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid md:grid-cols-[1fr_340px] gap-16 items-start">

          <div>
            <div className="mb-8">
              <PinIcon size={48} />
            </div>

            <h2
              id="manifesto-heading"
              className="font-display font-bold text-white leading-[1.2] tracking-[-1px] mb-10 max-w-[520px]"
              style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}
            >
              Você construiu o seu negócio na raça. Cada cliente conquistado, cada ano de reputação.
            </h2>

            <div className="space-y-6">
              {[
                'E hoje, quando alguém procura no Google, quem aparece é o concorrente do lado. O que faz menos. O que cobra mais. O que tem metade da sua experiência.',
                'Não é injusto. É técnico. O Google Meu Negócio não conhece você. Ainda.',
                'O Destaka existe para isso. Para traduzir a qualidade do seu trabalho em linguagem que o Google entende. Para fazer o invisível aparecer.',
                'Para garantir que, quando o cliente certo estiver buscando, ele vai te encontrar primeiro.',
              ].map((text, i) => (
                <p
                  key={i}
                  className="text-[16px]"
                  style={{ color: i === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}
                >
                  {text}
                </p>
              ))}
            </div>
          </div>

          <div className="md:sticky md:top-32 flex flex-col items-start">
            <div className="p-[2px] rounded-2xl mb-8 w-full" style={{ background: 'rgba(20,184,166,0.10)', boxShadow: '0 0 0 1px rgba(20,184,166,0.22)' }}>
              <div
                className="p-8 rounded-[14px]"
                style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(20,184,166,0.10)' }}
              >
                <p
                  className="font-display font-bold text-[18px] leading-[1.4]"
                  style={{ color: 'var(--accent-bright)' }}
                >
                  Quem faz bem feito não deveria perder clientes por causa de algoritmo.
                </p>
              </div>
            </div>

            <p className="text-[14px] font-medium mb-6" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Se você sabe que merece aparecer, comece aqui.
            </p>

            <Button variant="primary" size="lg" href="/login" className="whitespace-nowrap">
              <PinIcon size={16} color="#fff" bg="var(--accent)" />
              Fazer diagnóstico gratuito
              <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 text-[13px]">→</span>
            </Button>

            <p className="mt-5 text-[13px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Grátis. Sem cartão. Resultado em 30 segundos.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}

// COMO FUNCIONA

function ComoFunciona() {
  const steps = [
    {
      num: '01',
      title: 'Veja a nota do seu perfil',
      desc: 'Em 30 segundos, o Destaka analisa seu Google Meu Negócio e gera uma nota de 0 a 100. Você vê exatamente o que está te prejudicando.',
      cta: 'Fazer diagnóstico gratuito',
      href: '/login',
    },
    {
      num: '02',
      title: 'Conecte seu Google',
      desc: 'Um clique para autorizar. O Destaka acessa seu perfil e começa a trabalhar. Sem formulários, sem configuração técnica.',
      cta: null,
      href: null,
    },
    {
      num: '03',
      title: 'O Destaka cuida de tudo',
      desc: 'Posts semanais, respostas para avaliações, sugestões de fotos, serviços otimizados. Você cuida do seu negócio. O Destaka cuida do seu Google.',
      cta: null,
      href: null,
    },
  ]

  return (
    <section id="como-funciona" aria-labelledby="como-funciona-heading" className="px-6 py-24" style={{ background: 'var(--bg-gradient)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            id="como-funciona-heading"
            className="font-display font-bold text-white leading-[1.1] tracking-[-1px]"
            style={{ fontSize: 'clamp(28px, 3.5vw, 40px)' }}
          >
            Em 5 minutos, seu perfil<br />já está sendo otimizado.
          </h2>
        </div>

        <div className="relative grid md:grid-cols-3 gap-6">
          <div
            className="hidden md:block absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, rgba(20,184,166,0.6) 0%, rgba(20,184,166,0.3) 50%, rgba(20,184,166,0.6) 100%)' }}
          />

          {steps.map((step, i) => (
            <div
              key={step.num}
              className="p-[2px] rounded-2xl transition-transform duration-150 hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.06)', boxShadow: '0 0 0 1px rgba(255,255,255,0.10)' }}
            >
              <div
                className="relative rounded-[14px] p-8 flex flex-col gap-5 h-full"
                style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-[14px] flex-shrink-0"
                    style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.35)', color: '#14B8A6' }}
                  >
                    {i + 1}
                  </div>
                  <div
                    className="font-display font-bold text-[48px] leading-none tracking-[-2px]"
                    style={{ color: 'rgba(20,184,166,0.15)' }}
                  >
                    {step.num}
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-[18px] text-white mb-2">{step.title}</h3>
                  <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
                {step.cta && step.href && (
                  <Button variant="primary" size="md" href={step.href} className="mt-auto self-start">
                    {step.cta} →
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// RECURSOS

function Recursos() {
  const features: {
    title: string
    desc: string
    span: string
    large?: boolean
    wide?: boolean
  }[] = [
    { title: 'Descubra por que você não aparece', desc: 'Em 30 segundos, veja o que está errado no seu Google Meu Negócio. Diagnóstico claro, sem achismo.', span: 'lg:col-span-7', large: true },
    { title: 'Clientes te encontram sem você fazer nada', desc: 'Toda semana, conteúdo novo no seu perfil, escrito para o seu tipo de negócio e a sua cidade.', span: 'lg:col-span-5' },
    { title: 'Avaliação negativa? Já está respondida.', desc: 'Cada avaliação recebe resposta personalizada e profissional. Inclusive as de uma estrela.', span: 'lg:col-span-4' },
    { title: '42% mais clientes pedem rota até você', desc: 'Perfis com fotos atualizadas recebem 42% mais pedidos de rota no Google Meu Negócio.', span: 'lg:col-span-4' },
    { title: 'Seu negócio aparece para quem busca o que você faz', desc: 'Serviços cadastrados com os termos que os clientes realmente digitam no Google.', span: 'lg:col-span-4' },
    { title: 'Saiba o que seus clientes digitam para te encontrar', desc: 'As buscas reais que trazem gente ao seu perfil, com sugestões para atrair mais clientes da sua região.', span: 'sm:col-span-2 lg:col-span-12', wide: true },
    { title: 'Mais avaliações 5 estrelas, no automático', desc: 'Um código QR no balcão. O cliente escaneia e avalia na hora. Mais avaliações, mais confiança, mais movimento.', span: 'lg:col-span-5' },
    { title: 'Ninguém mexe no seu perfil sem você saber', desc: 'Alerta imediato se alguém alterar informações do seu Google Meu Negócio sem autorização.', span: 'lg:col-span-7' },
    { title: 'Toda segunda você sabe o que foi feito', desc: 'Resumo no email com tudo que o Destaka fez na semana. Sem precisar abrir painel.', span: 'lg:col-span-6' },
    { title: 'Veja o impacto real no seu negócio', desc: 'Relatório mensal com o que melhorou, quantas pessoas te encontraram e o que mudou nas buscas.', span: 'lg:col-span-6' },
  ]

  return (
    <section id="recursos" aria-labelledby="recursos-heading" className="px-6 py-24" style={{ background: 'var(--bg-gradient)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            id="recursos-heading"
            className="font-display font-bold leading-[1.1] tracking-[-1px] mb-5"
            style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#fff' }}
          >
            Tudo no piloto automático.<br />
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Sem depender de você.</span>
          </h2>
          <p className="text-[16px] max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>
            O Destaka cuida da sua visibilidade no Google enquanto você cuida do seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className={`p-[2px] rounded-2xl transition-transform duration-150 hover:-translate-y-1 ${f.span}`}
              style={{ background: 'rgba(20,184,166,0.10)', boxShadow: '0 0 0 1px rgba(20,184,166,0.22)' }}
            >
              <div
                className={`rounded-[14px] h-full ${f.wide ? 'flex flex-col sm:flex-row gap-6 p-7' : f.large ? 'flex gap-5 p-8' : 'flex gap-4 p-7'}`}
                style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(20,184,166,0.10)' }}
              >
                <PinIcon size={f.large ? 28 : 22} />
                <div>
                  <h3 className={`font-display font-bold mb-2 text-white ${f.large ? 'text-[17px]' : 'text-[15px]'}`}>
                    {f.title}
                  </h3>
                  <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button variant="primary" size="lg" href="/login">
            <PinIcon size={16} color="#fff" bg="var(--accent)" />
            Fazer diagnóstico gratuito
            <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 text-[13px]">→</span>
          </Button>
          <p className="mt-4 text-[14px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Descubra quanto seu perfil pode melhorar.
          </p>
        </div>
      </div>
    </section>
  )
}

// FOOTER

function Footer() {
  return (
    <footer className="px-6 py-12" style={{ background: '#071825', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <Logo size="sm" />
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Google Meu Negócio no piloto automático. Para quem merece ser encontrado primeiro.
        </p>
        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-[12px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Privacidade
            </Link>
            <Link href="/termos" className="text-[12px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Termos
            </Link>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              © 2026 Destaka
            </p>
          </div>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Destaka é uma plataforma desenvolvida e operada por{' '}
            <a href="https://unlmtd.etc.br" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}>
              UNLMTD
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

// PAGE

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Nav />
      <main>
        <Hero />
        <CustoDaInvisibilidade />
        <Problema />
        <AparecerPrimeiro />
        <Manifesto />
        <ComoFunciona />
        <Recursos />
      </main>
      <Footer />
    </>
  )
}
