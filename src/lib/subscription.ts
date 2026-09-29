import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { cacheGet, cacheSet } from '@/lib/redis'

const CACHE_TTL = 300 // 5 minutos

export async function isActiveSubscriber(orgId: string): Promise<boolean> {
  // Cache hit: evita chamada ao Stripe a cada page load
  const cached = await cacheGet<boolean>(`sub:${orgId}`)
  if (cached !== null) return cached

  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', orgId)
    .single()

  const customerId = (org as Record<string, unknown>)?.stripe_customer_id as string | null
  if (!customerId) {
    await cacheSet(`sub:${orgId}`, false, CACHE_TTL)
    return false
  }

  try {
    const stripe = getStripe()
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })
    const active = subscriptions.data.length > 0
    await cacheSet(`sub:${orgId}`, active, CACHE_TTL)
    return active
  } catch {
    return false
  }
}
