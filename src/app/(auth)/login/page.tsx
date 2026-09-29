'use client'

import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: 'Falha na autenticação. Tente novamente.',
  org_creation_failed: 'Não foi possível criar sua conta. Tente novamente.',
  profile_creation_failed: 'Não foi possível criar seu perfil. Tente novamente.',
  profile_link_failed: 'Não foi possível vincular seu perfil. Tente novamente.',
}

function LoginContent() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? 'Ocorreu um erro. Tente novamente.') : null

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/business.manage',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-gradient, #071a19)' }}>
      <div
        className="rounded-2xl p-10 w-full max-w-md text-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <h1 className="text-2xl font-semibold text-white mb-2">
          Bem-vindo ao Destaka
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Sua presença digital no piloto automático.
          <br />
          Conecte sua conta Google para começar.
        </p>

        {errorMessage && (
          <div
            className="rounded-xl px-4 py-3 mb-6 text-sm"
            style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            {errorMessage}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-xl px-6 py-3.5 font-medium transition-all hover:brightness-110 cursor-pointer"
          style={{ background: 'var(--accent, #14B8A6)', color: '#fff' }}
        >
          <GoogleIcon />
          Continuar com Google
        </button>
        <p className="text-xs mt-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Ao continuar, você autoriza o Destaka a gerenciar seu
          perfil no Google Meu Negócio. Você pode revogar esse
          acesso a qualquer momento.
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.168 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
