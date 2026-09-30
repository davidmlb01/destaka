export const dynamic = 'force-dynamic'

// Cria sessao de checkout no Stripe
import { NextRequest, NextResponse } from 'next/server'
import { getAuthOrg } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getStripe, PLANS } from '@/lib/stripe'

function createServiceClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { user, orgId } = auth

  const body = await request.json() as { plan?: string }
  const planKey = (body.plan ?? 'pro') as keyof typeof PLANS
  const plan = PLANS[planKey]

  if (!plan) {
    return NextResponse.json({ error: 'Plano invalido' }, { status: 400 })
  }

  const admin = createServiceClient()
  const stripe = getStripe()

  // Buscar ou criar customer no Stripe
  const { data: org } = await admin
    .from('organizations')
    .select('stripe_customer_id, name')
    .eq('id', orgId)
    .maybeSingle()

  let customerId = (org as Record<string, unknown>)?.stripe_customer_id as string | null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: (org as Record<string, unknown>)?.name as string ?? user.email!,
      metadata: { organization_id: orgId },
    })
    customerId = customer.id

    await admin
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', orgId)
  }

  // Criar checkout session
  const ALLOWED_ORIGINS = ['https://destaka.com.br', 'https://www.destaka.com.br']
  const rawOrigin = request.headers.get('origin') ?? ''
  const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://destaka.com.br'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard?checkout=cancel`,
    metadata: { organization_id: orgId },
    subscription_data: {
      metadata: { organization_id: orgId },
    },
  })

  return NextResponse.json({ url: session.url })
}
