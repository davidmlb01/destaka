import Link from 'next/link'
import type { Metadata } from 'next'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

export const metadata: Metadata = {
  title: 'Destaka Saúde: seu perfil no Google trabalhando por você',
  description:
    'Presença digital no piloto automático para médicos, dentistas e profissionais de saúde. Diagnóstico gratuito do seu Google Meu Negócio em 30 segundos.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Destaka Saúde: seu perfil no Google trabalhando por você',
    description:
      'Presença digital no piloto automático para profissionais de saúde. Diagnóstico gratuito em 30 segundos.',
    url: SITE_URL,
    siteName: 'Destaka',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Destaka Saúde: seu perfil no Google trabalhando por você',
    description:
      'Presença digital no piloto automático para profissionais de saúde. Diagnóstico gratuito em 30 segundos.',
  },
}

// FAQ DATA

const FAQ_ITEMS = [
  { q: 'Preciso dar acesso ao meu Google?', a: 'Sim, conexão segura via OAuth oficial do Google. Não armazenamos sua senha.' },
  { q: 'Tem contrato ou fidelidade?', a: 'Não. Cancele quando quiser, sem multa. E se seu score não subir pelo menos 15 pontos em 30 dias, devolvemos 100% do valor.' },
  { q: 'Funciona na minha cidade?', a: 'Sim, funciona em qualquer cidade do Brasil.' },
  { q: 'Quanto tempo para ver resultado?', a: 'Seu perfil começa a ser otimizado em minutos. Resultados visíveis nas buscas em 2 a 4 semanas.' },
  { q: 'Já uso Doctoralia. Preciso da Destaka?', a: 'São complementares. A Doctoralia é um marketplace. A Destaka otimiza seu Google, que é onde 46% das buscas locais acontecem.' },
  { q: 'É seguro?', a: '100%. Conexão via API oficial do Google. Dados protegidos. Conformidade LGPD.' },
]

// SCHEMA

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Destaka Saúde',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Presença digital no piloto automático para médicos, dentistas e profissionais de saúde. Otimização automática do Google Meu Negócio.',
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
        <Logo size="sm" href="/" vertical="Saúde" />
        <div className="hidden md:flex items-center gap-6 text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.68)' }}>
          <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
          <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
        </div>
        <Button variant="primary" size="sm" href="/login">
          Fazer diagnóstico gratuito
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
      className="relative flex items-center px-6 pt-24 pb-20 overflow-hidden"
      style={{ background: 'var(--bg-gradient)', minHeight: 'clamp(600px, 100dvh, 900px)' }}
    >
      <div className="absolute pointer-events-none" style={{ inset: 0, background: 'radial-gradient(ellipse 60% 50% at 80% -10%, rgba(20,184,166,0.12) 0%, transparent 70%)' }} />
      <div className="absolute pointer-events-none" style={{ inset: 0, background: 'radial-gradient(ellipse 40% 40% at -5% 110%, rgba(20,184,166,0.07) 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

          <div>
            <Badge className="mb-8">
              Para profissionais de saúde que merecem aparecer primeiro
            </Badge>

            <h1
              id="hero-heading"
              className="font-display font-bold text-white leading-[1.05] tracking-[-2.5px] mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
            >
              Você deveria<br />
              aparecer primeiro no Google.<br />
              <em className="not-italic" style={{ color: 'var(--accent)' }}>A gente faz isso acontecer.</em>
            </h1>

            <p
              className="leading-relaxed mb-10"
              style={{ color: 'rgba(255,255,255,0.68)', fontSize: 'clamp(16px, 2vw, 19px)' }}
            >
              O Google decide para quem o seu paciente vai ligar.<br />
              A Destaka decide o que o Google vai ver.
            </p>

            <Button variant="primary" size="lg" href="/login">
              <PinIcon size={16} color="#fff" bg="var(--accent)" />
              Fazer diagnóstico gratuito
              <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 text-[13px]">→</span>
            </Button>

            <p className="mt-4 text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Grátis. Sem cartão de crédito. Resultado em 30 segundos.
            </p>

            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>Conectado à API oficial do Google</span>
              </div>
            </div>
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
                { pct: '46%', label: 'das buscas no Google são locais', desc: 'Quase metade das pesquisas têm intenção local. Se você não aparece, seu concorrente aparece.' },
                { pct: '76%', label: 'ligam para o consultório no mesmo dia', desc: 'Quem busca um profissional de saúde tem urgência. Visibilidade é conversão imediata.' },
                { pct: '88%', label: 'confiam em avaliações online', desc: 'Avaliações têm o mesmo peso de uma indicação pessoal. Perfis sem resposta perdem credibilidade.' },
              ].map((stat, i) => (
                <div
                  key={stat.pct}
                  className="flex gap-5 px-7 py-6"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', borderTopWidth: i > 0 ? 1 : 0 }}
                >
                  <div
                    className="font-display font-bold leading-none tracking-[-3px] flex-shrink-0 w-24 text-right"
                    style={{ fontSize: 52, color: '#14B8A6' }}
                  >
                    {stat.pct}
                  </div>
                  <div className="pt-1">
                    <p className="font-display font-bold text-[14px] text-white mb-1 leading-snug">{stat.label}</p>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{stat.desc}</p>
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

// ANCORAGEM

function Ancoragem() {
  const rows = [
    { label: 'Custo mensal',          destaka: 'R$ 197',          agencia: 'R$ 3.000 a 8.000',  diy: 'Seu tempo' },
    { label: 'Tempo de setup',        destaka: '5 minutos',       agencia: '2 a 4 semanas',      diy: 'Horas todo mês' },
    { label: 'Posts no Google',       destaka: 'Automático',      agencia: 'Você fornece',       diy: 'Você faz' },
    { label: 'Respostas avaliações',  destaka: 'Automático',      agencia: 'Pode incluir',       diy: 'Você faz' },
    { label: 'Contrato',              destaka: 'Nenhum',          agencia: '6 a 12 meses',       diy: '-' },
    { label: 'Garantia resultado',    destaka: '30 dias ou 100%', agencia: 'Nenhuma',            diy: '-' },
  ]

  return (
    <section aria-label="Comparativo com agências" style={{ background: 'rgba(20,184,166,0.04)', borderTop: '1px solid rgba(20,184,166,0.15)', borderBottom: '1px solid rgba(20,184,166,0.15)' }}>
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: 'var(--accent)' }}>
            O custo da invisibilidade
          </p>
          <h2
            className="font-display font-bold text-white leading-[1.15] tracking-[-1.5px] mb-4"
            style={{ fontSize: 'clamp(24px, 3.5vw, 38px)' }}
          >
            Agências cobram R$3.000 a 8.000 por mês.<br className="hidden md:block" />
            Exigem reuniões, pedem conteúdo, demoram semanas.
          </h2>
          <p className="text-[17px]" style={{ color: 'rgba(255,255,255,0.68)' }}>
            A Destaka entrega tudo no piloto automático, por uma fração do custo.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden mb-10" style={{ border: '1px solid rgba(20,184,166,0.20)' }}>
          <div className="grid grid-cols-4 text-[12px] font-bold uppercase tracking-widest" style={{ background: 'rgba(20,184,166,0.10)' }}>
            <div className="px-5 py-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Critério</div>
            <div className="px-5 py-3 flex items-center gap-1.5" style={{ color: '#14B8A6' }}>
              <PinIcon size={12} />Destaka
            </div>
            <div className="px-5 py-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Agência</div>
            <div className="px-5 py-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Você mesmo</div>
          </div>

          {rows.map((row, i) => (
            <div
              key={row.label}
              className="grid grid-cols-4 text-[14px]"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: i % 2 === 0 ? 'rgba(7,26,25,0.8)' : '#071a19' }}
            >
              <div className="px-5 py-4 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{row.label}</div>
              <div className="px-5 py-4 font-bold" style={{ color: '#14B8A6' }}>{row.destaka}</div>
              <div className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.agencia}</div>
              <div className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.diy}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="primary" size="lg" href="/login">
            <PinIcon size={16} color="#fff" bg="var(--accent)" />
            Fazer diagnóstico gratuito
            <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 text-[13px]">→</span>
          </Button>
          <p className="mt-4 text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Sem contrato. Sem cadastro. Cancele quando quiser.
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
            <p className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: 'var(--accent)' }}>
              O problema real
            </p>
            <h2
              id="problema-heading"
              className="font-display font-bold leading-[1.1] tracking-[-1.5px] mb-6"
              style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#fff' }}
            >
              Você não perde pacientes<br />
              por falta de competência.
            </h2>
            <p className="text-[17px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Perde porque eles não te encontram.
            </p>
            <p className="text-[16px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.68)' }}>
              O profissional que aparece em primeiro não é necessariamente o melhor. É o mais visível. Quando alguém digita &quot;médico perto de mim&quot;, o Google decide quem aparece. E na maioria das vezes, não é quem merece mais.
            </p>
            <p className="text-[15px] leading-relaxed font-medium" style={{ color: 'var(--accent)' }}>
              Enquanto você lê isso, seus concorrentes estão recebendo os pacientes que deveriam ser seus.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { title: 'O paciente pesquisa', desc: 'Todo dia, dezenas de pessoas na sua cidade buscam pelo profissional que você é. O Google escolhe quem mostrar, não quem merece mais.' },
              { title: 'Perfis incompletos são penalizados', desc: '51% dos perfis de saúde no Google estão incompletos. Cada campo vazio é uma penalidade silenciosa que você nunca vai ver.' },
              { title: 'O concorrente aparece', desc: 'Não porque atende melhor. Porque o perfil está otimizado. Fotos atualizadas, posts recentes, avaliações respondidas.' },
            ].map((item) => (
              <div
                key={item.title}
                className="p-[2px] rounded-2xl transition-transform duration-150 hover:-translate-y-1"
                style={{ background: 'rgba(255,255,255,0.06)', boxShadow: '0 0 0 1px rgba(255,255,255,0.10)' }}
              >
                <div
                  className="flex gap-4 p-5 rounded-[14px] h-full"
                  style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)' }}
                >
                  <PinIcon size={22} />
                  <div>
                    <p className="font-display font-bold text-[15px] mb-1 text-white">{item.title}</p>
                    <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.68)' }}>{item.desc}</p>
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

// COMO FUNCIONA

function ComoFunciona() {
  const steps = [
    {
      num: '01',
      title: 'Ver a nota do meu perfil',
      desc: 'Em 30 segundos, a Destaka analisa seu perfil no Google e gera uma nota de 0 a 100. Você vê exatamente onde está perdendo visibilidade.',
      cta: 'Fazer diagnóstico gratuito',
      href: '/login',
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
    <section id="como-funciona" aria-labelledby="como-funciona-heading" className="px-6 py-24" style={{ background: 'var(--bg-gradient)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: 'var(--accent)' }}>Como funciona</p>
          <h2
            id="como-funciona-heading"
            className="font-display font-bold text-white leading-[1.1] tracking-[-1.5px]"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
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
                className="relative rounded-[14px] p-7 flex flex-col gap-4 h-full"
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
                  <h3 className="font-display font-bold text-[20px] text-white mb-2">{step.title}</h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.68)' }}>{step.desc}</p>
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

// FAQ

function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="px-6 py-24" style={{ background: '#071a19' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: 'var(--accent)' }}>Perguntas frequentes</p>
          <h2
            id="faq-heading"
            className="font-display font-bold text-white leading-[1.1] tracking-[-1.5px]"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
          >
            Tudo que você precisa saber
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {FAQ_ITEMS.map((faq) => (
            <div
              key={faq.q}
              className="p-[2px] rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.06)', boxShadow: '0 0 0 1px rgba(255,255,255,0.10)' }}
            >
              <div
                className="p-6 rounded-[14px] h-full"
                style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)' }}
              >
                <h3 className="font-display font-bold text-[16px] text-white mb-2">{faq.q}</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.68)' }}>{faq.a}</p>
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
    { title: 'Descubra por que você não aparece', desc: 'Em 30 segundos, você vê exatamente o que está afastando pacientes do seu perfil. Sem achismo, com diagnóstico claro de cada ponto fraco.', span: 'lg:col-span-7', large: true },
    { title: 'Pacientes te encontram sem você fazer nada', desc: 'Toda semana, conteúdo novo aparece no seu perfil do Google, escrito para a sua especialidade e a sua cidade. Você não toca em nada.', span: 'lg:col-span-5' },
    { title: 'Avaliação negativa? Já está respondida.', desc: 'Cada avaliação recebe uma resposta personalizada e profissional. Inclusive as de uma estrela, que são as que mais afastam pacientes novos.', span: 'lg:col-span-4' },
    { title: '42% mais pacientes pedem rota até você', desc: 'A Destaka indica exatamente quais fotos publicar e quando atualizar. Perfis com fotos atualizadas recebem 42% mais pedidos de rota no Google.', span: 'lg:col-span-4' },
    { title: 'Seu consultório aparece para quem busca o que você faz', desc: 'Seus serviços ficam cadastrados com os termos que os pacientes realmente digitam. Consultórios similares têm em média 11 serviços visíveis. Quantos o seu tem?', span: 'lg:col-span-4' },
    { title: 'Saiba o que seus pacientes digitam para te encontrar', desc: 'Você descobre as buscas reais que trazem gente ao seu perfil. E recebe sugestões de termos novos para atrair ainda mais pacientes da sua região.', span: 'sm:col-span-2 lg:col-span-12', wide: true },
    { title: 'Mais avaliações 5 estrelas, no piloto automático', desc: 'Um código QR na recepção. O paciente escaneia e avalia na hora, sem complicação. Mais avaliações positivas, mais confiança, mais agendamentos.', span: 'lg:col-span-5' },
    { title: 'Ninguém mexe no seu perfil sem você saber', desc: 'Se alguém alterar qualquer informação do seu Google sem autorização, você recebe um alerta antes que o dano aconteça.', span: 'lg:col-span-7' },
    { title: 'Toda segunda você sabe o que foi feito', desc: 'Um resumo direto no seu email com tudo que a Destaka fez na semana. Sem precisar abrir painel, sem linguagem técnica.', span: 'lg:col-span-6' },
    { title: 'Veja o impacto real no seu consultório', desc: 'Todo mês, um relatório mostra o que melhorou, quantas pessoas te encontraram e o que mudou nas buscas. Em português, sem siglas.', span: 'lg:col-span-6' },
  ]

  return (
    <section id="recursos" aria-labelledby="recursos-heading" className="px-6 py-24" style={{ background: 'var(--bg-gradient)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: 'var(--accent)' }}>O que a Destaka faz</p>
          <h2
            id="recursos-heading"
            className="font-display font-bold leading-[1.1] tracking-[-1.5px] mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#fff' }}
          >
            Tudo que uma agência cobraria milhares por mês.<br />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Funcionando no piloto automático, sem depender de você.</span>
          </h2>
          <p className="text-[17px] max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.68)' }}>
            A Destaka cuida da sua visibilidade enquanto você cuida dos pacientes. Cada um no que sabe fazer melhor.
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
                className={`rounded-[14px] h-full ${f.wide ? 'flex flex-col sm:flex-row gap-6 p-6' : f.large ? 'flex gap-5 p-8' : 'flex gap-4 p-6'}`}
                style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(20,184,166,0.10)' }}
              >
                <PinIcon size={f.large ? 28 : 22} />
                <div>
                  <h3 className={`font-display font-bold mb-1.5 text-white ${f.large ? 'text-[18px]' : 'text-[16px]'}`}>
                    {f.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.68)' }}>{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Button variant="primary" size="lg" href="/login">
            <PinIcon size={16} color="#fff" bg="var(--accent)" />
            Fazer diagnóstico gratuito
            <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 text-[13px]">→</span>
          </Button>
          <p className="mt-4 text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Descubra quanto seu perfil pode melhorar. Resultado em 30 segundos.
          </p>
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
      <div className="absolute pointer-events-none" style={{ inset: 0, background: 'radial-gradient(ellipse 50% 40% at 90% 0%, rgba(20,184,166,0.10) 0%, transparent 70%)' }} />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid md:grid-cols-[1fr_auto] gap-12 md:gap-20 items-start">

          <div>
            <div className="mb-8">
              <PinIcon size={48} />
            </div>

            <h2
              id="manifesto-heading"
              className="font-display font-bold text-white leading-[1.15] tracking-[-1.5px] mb-10"
              style={{ fontSize: 'clamp(24px, 4vw, 38px)' }}
            >
              Você passou anos se formando.<br />
              Fez residência. Aprendeu a cuidar<br />
              de pessoas melhor do que qualquer um na sua cidade.
            </h2>

            <div className="space-y-5">
              {[
                'E hoje, quando alguém digita "médico perto de mim", aparece o consultório do lado. O que faz menos. O que cobra mais caro. O que tem metade da sua experiência.',
                'Não é injusto. É técnico. O Google não conhece você. Ainda.',
                'A Destaka existe para isso. Para traduzir a sua competência em linguagem que o algoritmo entende. Para fazer o invisível aparecer.',
                'Para garantir que, quando o paciente certo estiver buscando, ele vai te encontrar primeiro.',
              ].map((text, i) => (
                <p
                  key={i}
                  className="text-[17px] leading-relaxed"
                  style={{ color: i === 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.58)' }}
                >
                  {text}
                </p>
              ))}
            </div>
          </div>

          <div className="md:sticky md:top-32 flex flex-col items-start md:max-w-[300px]">
            <div className="p-[2px] rounded-2xl mb-8 w-full" style={{ background: 'rgba(20,184,166,0.10)', boxShadow: '0 0 0 1px rgba(20,184,166,0.22)' }}>
              <div
                className="p-7 rounded-[14px]"
                style={{ background: '#071a19', boxShadow: 'inset 0 1px 1px rgba(20,184,166,0.10)' }}
              >
                <p
                  className="font-display font-bold text-[18px] leading-[1.35]"
                  style={{ color: 'var(--accent-bright)' }}
                >
                  Quem salva vidas não deveria perder pacientes por causa de burocracia digital.
                </p>
              </div>
            </div>

            <Button variant="primary" size="lg" href="/login">
              <PinIcon size={16} color="#fff" bg="var(--accent)" />
              Fazer diagnóstico gratuito
              <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 text-[13px]">→</span>
            </Button>

            <p className="mt-5 text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Grátis. Sem cartão. Resultado em 30 segundos.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}

// FOOTER

function Footer() {
  return (
    <footer className="px-6 py-10" style={{ background: '#071825', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo size="sm" vertical="Saúde" />
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Google Business Profile no piloto automático. Para profissionais de saúde que merecem aparecer primeiro.
        </p>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="text-[12px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Privacidade
          </Link>
          <Link href="/termos" className="text-[12px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Termos
          </Link>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © 2026 Destaka
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
        <Ancoragem />
        <Problema />
        <ComoFunciona />
        <FAQ />
        <Recursos />
        <Manifesto />
      </main>
      <Footer />
    </>
  )
}
