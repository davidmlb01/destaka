import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// POST /api/stripe/checkout
// Cria uma Stripe Checkout Session para o plano Pro
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { plan = 'pro' } = await request.json().catch(() => ({}))

  const planConfig = PLANS[plan as keyof typeof PLANS]
  if (!planConfig) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()
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

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: dbUser?.stripe_customer_id || undefined,
    customer_email: !dbUser?.stripe_customer_id ? user.email! : undefined,
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
    locale: 'pt-BR',
  })

  return NextResponse.json({ url: session.url })
}
