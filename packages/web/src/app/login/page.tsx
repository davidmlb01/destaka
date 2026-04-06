'use client'

import { createBrowserClient } from '@supabase/ssr'

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function LoginPage() {
  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
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
          <p
            className="text-center mb-8"
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}
          >
            Acesse com o Google para conectar seu perfil no Google Meu Negócio.
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

          <p
            className="text-center mt-6"
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.6 }}
          >
            Ao entrar, você autoriza a Destaka a acessar e otimizar seu perfil no Google Meu Negócio.
          </p>
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
