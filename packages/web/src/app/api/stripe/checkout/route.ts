import { NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { stripe, PLANS } from '@/lib/stripe'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/redis'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/stripe/checkout
// Cria uma Stripe Checkout Session para o plano Pro
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user: rlUser } } = await supabase.auth.getUser()
  if (rlUser) {
    const count = await rateLimit(`stripe-checkout:${rlUser.id}`, 3600)
    if (count !== null && count > 10) {
      logger.warn('stripe/checkout', 'rate limit atingido', { userId: rlUser.id })
      return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
    }
  }

  const auth = await getAuthenticatedProfile('id')
  if (auth.error) return auth.error

  const { user, serviceClient } = auth

  const { plan = 'pro' } = await request.json().catch(() => ({}))

  const planConfig = PLANS[plan as keyof typeof PLANS]
  if (!planConfig) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const { data: dbUser } = await serviceClient
    .from('users')
    .select('stripe_customer_id, plan')
    .eq('id', user.id)
    .single()

  // Usuário já tem plano ativo
  if (dbUser?.plan === plan) {
    return NextResponse.json({ error: 'Plano já ativo' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://destaka.com.br'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: dbUser?.stripe_customer_id || undefined,
      customer_email: !dbUser?.stripe_customer_id ? user.email! : undefined,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/saude/dashboard?checkout=success`,
      cancel_url: `${appUrl}/saude/dashboard?checkout=cancelled`,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
      locale: 'pt-BR',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    logger.error('stripe/checkout', 'Erro ao criar sessão de checkout', { err, userId: user.id, plan })
    return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 })
  }
}
