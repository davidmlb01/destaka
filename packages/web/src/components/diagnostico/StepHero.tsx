'use client'

import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface StepHeroProps {
  onStart: (clinicName: string, city: string) => void
}

export function StepHero({ onStart }: StepHeroProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const clinic = (form.elements.namedItem('clinic') as HTMLInputElement).value.trim()
    const city = (form.elements.namedItem('city') as HTMLInputElement).value.trim()
    if (clinic && city) onStart(clinic, city)
  }

  return (
    <section
      className="min-h-screen flex items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Decorative orb âmbar — contraste de cor */}
      <div
        className="absolute rounded-full pointer-events-none blur-[120px]"
        style={{
          width: 500, height: 500,
          background: 'rgba(14,165,233,0.18)',
          top: -120, right: -180,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none blur-[80px]"
        style={{
          width: 280, height: 280,
          background: 'rgba(22,163,74,0.12)',
          bottom: -60, left: -80,
        }}
      />
      {/* Anel decorativo âmbar */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 480, height: 480,
          border: '1px solid rgba(14,165,233,0.15)',
          top: -140, right: -140,
        }}
      />

      <div className="max-w-[580px] w-full text-center relative z-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Badge */}
        <Badge className="mb-8">Diagnóstico gratuito, sem cadastro</Badge>

        {/* Headline */}
        <h1
          className="font-display font-extrabold text-white leading-[1.05] tracking-[-2px] mb-5"
          style={{ fontSize: 'clamp(36px, 5.5vw, 52px)' }}
        >
          Seu consultório aparece<br />
          quando o paciente{' '}
          <em className="not-italic" style={{ color: 'var(--accent)' }}>procura?</em>
        </h1>

        {/* Subheadline */}
        <p
          className="text-[17px] leading-relaxed mb-10 max-w-[460px] mx-auto"
          style={{ color: 'rgba(255,255,255,0.62)' }}
        >
          Em 30 segundos a Destaka analisa seu perfil no Google e mostra exatamente quanto você está perdendo e por quê.
        </p>

        {/* Search card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 text-left"
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          <p
            className="text-[11px] font-bold tracking-[1.5px] uppercase mb-4"
            style={{ color: '#57534E' }}
          >
            Buscar minha clínica
          </p>

          <div className="flex flex-col gap-3 mb-4">
            {/* Input clínica */}
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none select-none"
                style={{ color: '#161B26' }}
              >
                🏥
              </span>
              <input
                name="clinic"
                type="text"
                placeholder="Nome do consultório ou clínica"
                autoComplete="off"
                className="w-full py-4 pl-11 pr-4 rounded-xl text-[15px] font-body outline-none transition-all"
                style={{
                  background: '#F0FDF4',
                  border: '1.5px solid #BBF7D0',
                  color: '#1C1917',
                }}
                onFocus={e => {
                  e.currentTarget.style.border = '1.5px solid #161B26'
                  e.currentTarget.style.background = '#fff'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,17,23,0.12)'
                }}
                onBlur={e => {
                  e.currentTarget.style.border = '1.5px solid #BBF7D0'
                  e.currentTarget.style.background = '#F0FDF4'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Input cidade */}
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none select-none"
                style={{ color: 'var(--accent-hover)' }}
              >
                📍
              </span>
              <input
                name="city"
                type="text"
                placeholder="Cidade (ex: São Paulo, SP)"
                autoComplete="off"
                className="w-full py-4 pl-11 pr-4 rounded-xl text-[15px] font-body outline-none transition-all"
                style={{
                  background: '#FFFBEB',
                  border: '1.5px solid #FDE68A',
                  color: '#1C1917',
                }}
                onFocus={e => {
                  e.currentTarget.style.border = '1.5px solid #0284C7'
                  e.currentTarget.style.background = '#fff'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.12)'
                }}
                onBlur={e => {
                  e.currentTarget.style.border = '1.5px solid #FDE68A'
                  e.currentTarget.style.background = '#FFFBEB'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          {/* CTA button */}
          <Button type="submit" variant="green" size="lg" fullWidth>
            <span style={{ color: 'var(--accent-bright)' }}>✦</span>
            Ver a nota do meu perfil
          </Button>

          <p className="text-center text-[12px] mt-3" style={{ color: '#9CA3AF' }}>
            Grátis. Sem spam. Resultado em segundos.
          </p>
        </form>

        {/* Linha divisória âmbar */}
        <div className="flex items-center gap-4 my-8 px-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(14,165,233,0.5)' }}>
            Por que importa
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6">
          {[
            { num: '51%', lbl: 'dos perfis estão\nincompletos' },
            { num: '3x', lbl: 'mais pacientes com\nperfil otimizado' },
            { num: '5min', lbl: 'para a Destaka\ncorrigir tudo' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-6">
              {i > 0 && (
                <div className="w-px h-9" style={{ background: 'rgba(255,255,255,0.1)' }} />
              )}
              <div className="text-center">
                <div
                  className="font-display font-extrabold text-[26px] leading-none"
                  style={{ color: 'var(--accent-bright)' }}
                >
                  {item.num}
                </div>
                <div
                  className="text-[10px] mt-1 leading-tight whitespace-pre-line"
                  style={{ color: 'rgba(255,255,255,0.38)' }}
                >
                  {item.lbl}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
