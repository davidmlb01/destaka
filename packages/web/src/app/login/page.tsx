'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getErrorMessage(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const err = params.get('error')
  if (err === 'missing_scope') return 'Para usar a Destaka, você precisa autorizar o acesso ao Google Meu Negócio. Clique em "Entrar com Google" e aceite todas as permissões.'
  if (err === 'db_error') return 'Erro ao salvar sua conta. Tente novamente.'
  if (err === 'auth_failed') return 'Falha na autenticação. Tente novamente.'
  return null
}

export default function LoginPage() {
  const [demoLoading, setDemoLoading] = useState(false)
  const errorMessage = getErrorMessage()

  async function handleDemoLogin() {
    setDemoLoading(true)
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' })
      if (res.ok) {
        window.location.href = '/dashboard'
      } else {
        const data = await res.json()
        alert('Erro no login demo: ' + (data.error ?? 'tente novamente'))
        setDemoLoading(false)
      }
    } catch {
      alert('Erro de conexão. Verifique se o servidor está rodando.')
      setDemoLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: 'email profile https://www.googleapis.com/auth/business.manage',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) {
      console.error('OAuth error:', error.message)
      alert('Erro ao iniciar login: ' + error.message)
    } else {
      console.log('OAuth redirect URL:', data?.url)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #14532D 0%, #0A2E18 100%)' }}
    >
      {/* Orbs de fundo */}
      <div
        className="fixed rounded-full pointer-events-none blur-[140px]"
        style={{ width: 500, height: 500, background: 'rgba(217,119,6,0.14)', top: -150, right: -150 }}
      />
      <div
        className="fixed rounded-full pointer-events-none blur-[100px]"
        style={{ width: 300, height: 300, background: 'rgba(22,163,74,0.08)', bottom: -80, left: -80 }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <span style={{ color: '#F59E0B', fontSize: 28, filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' }}>✦</span>
          <span
            className="font-display font-extrabold text-white tracking-tight"
            style={{ fontSize: 26 }}
          >
            Desta<span style={{ color: '#F59E0B' }}>ka</span>
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h1
            className="font-display font-extrabold text-white text-center mb-2"
            style={{ fontSize: 26, letterSpacing: '-0.5px' }}
          >
            Conecte sua clínica
          </h1>

          {errorMessage && (
            <div
              className="rounded-xl px-4 py-3 mb-4 text-sm text-center"
              style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', color: '#FCD34D', lineHeight: 1.5 }}
            >
              {errorMessage}
            </div>
          )}
          <p
            className="text-center mb-8"
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.6 }}
          >
            Conecte-se com o mesmo email que você usou para criar o seu Google Meu Negócio.
          </p>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 rounded-xl font-display font-bold transition-all"
            style={{
              background: '#ffffff',
              color: '#1C1917',
              padding: '14px 24px',
              fontSize: 15,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <GoogleIcon />
            Entrar com Google
          </button>

          {isDemoMode && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>ou</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <button
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl font-display font-bold transition-all"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: '#F59E0B',
                  padding: '13px 24px',
                  fontSize: 14,
                  opacity: demoLoading ? 0.6 : 1,
                  cursor: demoLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {demoLoading ? 'Entrando...' : '✦ Entrar como Demo'}
              </button>
              <p className="text-center mt-3" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
                Dados simulados. Sem necessidade de conta Google.
              </p>
            </>
          )}

          {!isDemoMode && (
            <p
              className="text-center mt-6"
              style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.6 }}
            >
              Ao entrar, você autoriza a Destaka a acessar o seu perfil no Google Meu Negócio.
            </p>
          )}
        </div>

        {/* Rodapé */}
        <p className="text-center mt-6" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          destaka.com.br
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
