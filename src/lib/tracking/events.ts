// Eventos de conversão para GA4 e Meta Pixel
// Só dispara se os scripts estiverem carregados (env vars configuradas)

type GtagFn = (...args: unknown[]) => void
type FbqFn = (...args: unknown[]) => void

function gtag(): GtagFn | null {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    return (window as Record<string, unknown>).gtag as GtagFn
  }
  return null
}

function fbq(): FbqFn | null {
  if (typeof window !== 'undefined' && 'fbq' in window) {
    return (window as Record<string, unknown>).fbq as FbqFn
  }
  return null
}

/** Lead capturado (diagnóstico gratuito) */
export function trackLead(email?: string) {
  gtag()?.('event', 'generate_lead', { currency: 'BRL', value: 0 })
  fbq()?.('track', 'Lead', email ? { content_name: 'diagnostico_gratuito' } : undefined)
}

/** Usuário fez login (signup via Google OAuth) */
export function trackSignUp() {
  gtag()?.('event', 'sign_up', { method: 'google' })
  fbq()?.('track', 'CompleteRegistration')
}

/** Clicou em começar checkout */
export function trackBeginCheckout() {
  gtag()?.('event', 'begin_checkout', { currency: 'BRL', value: 197 })
  fbq()?.('track', 'InitiateCheckout', { currency: 'BRL', value: 197 })
}

/** Compra concluída (pós-Stripe) */
export function trackPurchase() {
  gtag()?.('event', 'purchase', { currency: 'BRL', value: 197, transaction_id: `destaka_${Date.now()}` })
  fbq()?.('track', 'Purchase', { currency: 'BRL', value: 197 })
}

/** Onboarding concluído */
export function trackOnboardingComplete() {
  gtag()?.('event', 'tutorial_complete')
  fbq()?.('trackCustom', 'OnboardingComplete')
}
