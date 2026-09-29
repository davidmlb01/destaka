// Verifica se o usuario tem assinatura ativa no Stripe
import { NextResponse } from 'next/server'
import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { getStripe } from '@/lib/stripe'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  // Buscar stripe_customer_id da org
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', orgId)
    .single()

  const customerId = (org as Record<string, unknown>)?.stripe_customer_id as string | null

  if (!customerId) {
    return privateJson({ active: false, plan: null })
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
      return privateJson({
        active: true,
        plan: sub.items.data[0]?.price?.id ?? null,
      })
    }
  } catch (err) {
    console.error('[stripe/status] Error:', err instanceof Error ? err.message : err)
  }

  return privateJson({ active: false, plan: null })
}
