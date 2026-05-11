import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export function useAuth() {
  const [demoLoading, setDemoLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/saude/dashboard')
      }
    })
  }, [router])

  async function handleDemoLogin() {
    setDemoLoading(true)
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' })
      if (res.ok) {
        window.location.href = '/saude/dashboard'
      } else {
        const data = await res.json()
        toast.error('Erro no login demo: ' + (data.error ?? 'tente novamente'))
        setDemoLoading(false)
      }
    } catch {
      toast.error('Erro de conexão. Verifique se o servidor está rodando.')
      setDemoLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
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
      toast.error('Erro ao iniciar login: ' + error.message)
    }
  }

  return {
    isDemoMode,
    demoLoading,
    handleDemoLogin,
    handleGoogleSignIn,
  }
}
