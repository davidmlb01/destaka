// Cria sessao de checkout no Stripe
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getStripe, PLANS } from '@/lib/stripe'

function createServiceClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { plan?: string }
  const planKey = (body.plan ?? 'pro') as keyof typeof PLANS
  const plan = PLANS[planKey]

  if (!plan) {
    return NextResponse.json({ error: 'Plano invalido' }, { status: 400 })
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  const admin = createServiceClient()
  const stripe = getStripe()

  // Buscar ou criar customer no Stripe
  const { data: org } = await admin
    .from('organizations')
    .select('stripe_customer_id, name')
    .eq('id', professional.organization_id)
    .single()

  let customerId = (org as Record<string, unknown>)?.stripe_customer_id as string | null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: (org as Record<string, unknown>)?.name as string ?? user.email!,
      metadata: { organization_id: professional.organization_id },
    })
    customerId = customer.id

    await admin
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', professional.organization_id)
  }

  // Criar checkout session
  const origin = request.headers.get('origin') ?? 'https://destaka.com.br'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard?checkout=cancel`,
    metadata: { organization_id: professional.organization_id },
  })

  return NextResponse.json({ url: session.url })
}
