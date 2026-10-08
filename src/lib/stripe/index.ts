import Stripe from 'stripe'

let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
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
  priceId: process.env.STRIPE_PRICE_PRO!,
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
