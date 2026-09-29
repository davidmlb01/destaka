import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function isActiveSubscriber(orgId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', orgId)
    .single()

  const customerId = (org as Record<string, unknown>)?.stripe_customer_id as string | null
  if (!customerId) return false

  try {
    const stripe = getStripe()
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })
    return subscriptions.data.length > 0
  } catch {
    return false
  }
}
