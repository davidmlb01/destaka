import Stripe from 'stripe'

let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
    _stripe = new Stripe(key)
  }
  return _stripe
}

// Compatibilidade com imports existentes (lazy proxy)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as never)[prop]
  },
})

// Plano unico R$197/mes (decisao David 08/10/2026)
export const PLAN = {
  name: 'Destaka',
  price: 19700, // R$197 em centavos
  priceId: process.env.STRIPE_PRICE_PRO ?? (() => { throw new Error('STRIPE_PRICE_PRO is not configured') })(),
  features: [
    '1 perfil GMB',
    'Diagnóstico semanal',
    'Respostas automáticas',
    'Posts automáticos',
    'Relatório PDF',
    'Monitoramento de concorrentes',
  ],
} as const

/** @deprecated Use PLAN (plano unico). Mantido para compatibilidade temporaria. */
export const PLANS = {
  pro: PLAN,
} as const
