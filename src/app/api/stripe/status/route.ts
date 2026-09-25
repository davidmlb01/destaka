// Verifica se o usuario tem assinatura ativa no Stripe
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ active: false, plan: null })
  }

  // Buscar stripe_customer_id da org
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', professional.organization_id)
    .single()

  const customerId = (org as Record<string, unknown>)?.stripe_customer_id as string | null

  if (!customerId) {
    return NextResponse.json({ active: false, plan: null })
  }

  try {
    const stripe = getStripe()
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0]
      return NextResponse.json({
        active: true,
        plan: sub.items.data[0]?.price?.id ?? null,
      })
    }
  } catch (err) {
    console.error('[stripe/status] Error:', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ active: false, plan: null })
}
