import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export function useAuth() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/dashboard')
      }
    })
  }, [router])

  async function handleGoogleSignIn() {
    const supabase = createClient()
    // Propaga ?ref=USER_ID para rastreamento de indicação
    const ref = new URLSearchParams(window.location.search).get('ref')
    const callbackUrl = ref
      ? `${window.location.origin}/api/auth/callback?ref=${encodeURIComponent(ref)}`
      : `${window.location.origin}/api/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
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
    handleGoogleSignIn,
  }
}
