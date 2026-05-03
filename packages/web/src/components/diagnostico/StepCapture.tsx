'use client'

import { useState } from 'react'

export function StepCapture() {
  const [email, setEmail] = useState('')

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    window.location.href = '/login'
  }

  function handleGoogleAuth() {
    window.location.href = '/login'
  }

  const benefits = [
    'Diagnóstico completo de 50+ pontos',
    'Otimização automática em 5 minutos',
    'Sem cartão de crédito no teste grátis',
    'Cancele quando quiser',
  ]

  return (
    <section
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: 'linear-gradient(160deg, #14532D 0%, #0A2E18 100%)' }}
    >
      {/* Orbs decorativos */}
      <div
        className="absolute rounded-full pointer-events-none blur-[120px]"
        style={{ width: 400, height: 400, background: 'rgba(217,119,6,0.2)', top: -100, right: -100 }}
      />
      <div
        className="absolute rounded-full pointer-events-none blur-[80px]"
        style={{ width: 250, height: 250, background: 'rgba(22,163,74,0.1)', bottom: -60, left: -60 }}
      />

      <div className="max-w-[480px] w-full text-center relative z-10">

        {/* Ícone */}
        <div
          className="text-[48px] mb-6 leading-none"
          style={{ color: '#F59E0B', filter: 'drop-shadow(0 0 16px rgba(245,158,11,0.55))' }}
        >
          ✦
        </div>

        {/* Headline */}
        <h2
          className="font-display font-extrabold text-white leading-[1.15] tracking-[-1.5px] mb-3"
          style={{ fontSize: 'clamp(28px, 5vw, 40px)' }}
        >
          Pronto para{' '}
          <em className="not-italic" style={{ color: '#F59E0B' }}>aparecer primeiro?</em>
        </h2>

        <p className="text-[16px] leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Conecte seu Google e a Destaka começa a corrigir os 5 problemas encontrados agora.
        </p>

        {/* Card de auth */}
        <div
          className="rounded-2xl p-7 text-left mb-6"
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          <p
            className="text-[11px] font-bold tracking-[1.5px] uppercase mb-4"
            style={{ color: '#57534E' }}
          >
            Criar conta grátis
          </p>

          {/* Botão Google */}
          <button
            onClick={handleGoogleAuth}
            className="w-full rounded-xl py-3.5 font-body font-semibold text-[15px] flex items-center justify-center gap-2.5 mb-3 transition-all google-auth-btn"
            style={{
              background: '#fff',
              color: '#1C1917',
              border: '1.5px solid #E7E5E4',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-1 mb-3">
            <div className="flex-1 h-px" style={{ background: '#E7E5E4' }} />
            <span className="text-[12px]" style={{ color: '#9CA3AF' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: '#E7E5E4' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Seu e-mail profissional"
              className="w-full px-4 py-3.5 rounded-xl font-body text-[15px] outline-none mb-3 transition-all"
              style={{
                background: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                color: '#1C1917',
              }}
              onFocus={e => {
                e.currentTarget.style.border = '1.5px solid #14532D'
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20,83,45,0.1)'
              }}
              onBlur={e => {
                e.currentTarget.style.border = '1.5px solid #BBF7D0'
                e.currentTarget.style.background = '#F0FDF4'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <button
              type="submit"
              className="w-full rounded-xl py-4 font-display font-extrabold text-[15px] text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #14532D 0%, #166534 100%)',
                boxShadow: '0 4px 20px rgba(20,83,45,0.35)',
              }}
            >
              Receber diagnóstico completo →
            </button>
          </form>
        </div>

        {/* Benefits */}
        <div className="flex flex-col gap-2.5">
          {benefits.map(benefit => (
            <div key={benefit} className="flex items-center justify-center gap-2 text-[14px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <span className="font-bold" style={{ color: '#16A34A' }}>✓</span>
              {benefit}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
