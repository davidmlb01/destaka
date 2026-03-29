import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

export const PLANS = {
  essencial: {
    name: 'Essencial',
    price: 14700, // R$147 em centavos
    priceId: process.env.STRIPE_PRICE_ESSENCIAL!,
    features: ['1 perfil GMB', 'Diagnóstico mensal', 'Monitoramento de avaliações'],
  },
  pro: {
    name: 'Pro',
    price: 19700, // R$197 em centavos
    priceId: process.env.STRIPE_PRICE_PRO!,
    features: ['1 perfil GMB', 'Diagnóstico semanal', 'Respostas automáticas', 'Posts automáticos', 'Relatório PDF'],
  },
  agencia: {
    name: 'Agência',
    price: 49700, // R$497 em centavos
    priceId: process.env.STRIPE_PRICE_AGENCIA!,
    features: ['Até 10 perfis GMB', 'Tudo do Pro', 'White label', 'Dashboard multi-cliente'],
  },
} as const
