import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { cacheGet, cacheSet } from '@/lib/redis'

const CACHE_TTL = 300 // 5 minutos

export async function isActiveSubscriber(orgId: string): Promise<boolean> {
  // L1: Cache Redis (mais rápido, evita qualquer query)
  const cached = await cacheGet<boolean>(`sub:${orgId}`)
  if (cached !== null) return cached

  const supabase = await createClient()

  // L2: Banco de dados (subscription_status salvo pelo webhook)
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_status, stripe_customer_id')
    .eq('id', orgId)
    .single()

  const dbStatus = (org as Record<string, unknown>)?.subscription_status as string | null

  if (dbStatus === 'active') {
    await cacheSet(`sub:${orgId}`, true, CACHE_TTL)
    return true
  }

  if (dbStatus === 'cancelled') {
    await cacheSet(`sub:${orgId}`, false, CACHE_TTL)
    return false
  }

  // L3: Fallback Stripe API (para orgs que assinaram antes do campo subscription_status)
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

    // Atualiza banco para próxima vez não precisar do Stripe
    if (active) {
      await supabase
        .from('organizations')
        .update({ subscription_status: 'active' })
        .eq('id', orgId)
    }

    return active
  } catch {
    return false
  }
}
