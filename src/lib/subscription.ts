import { createClient } from '@/lib/supabase/server'
import { cacheGet, cacheSet } from '@/lib/redis'

const CACHE_TTL = 300 // 5 minutos

// Emails com acesso completo sem Stripe (testing/admin)
const VIP_EMAILS = (process.env.VIP_BYPASS_EMAILS ?? '').split(',').filter(Boolean)

export async function isVipBypass(orgId: string): Promise<boolean> {
  if (VIP_EMAILS.length === 0) return false
  const supabase = await createClient()
  const { data: prof } = await supabase
    .from('professionals')
    .select('user_id')
    .eq('organization_id', orgId)
    .maybeSingle()
  if (!prof?.user_id) return false
  const { data: { user } } = await supabase.auth.getUser()
  return !!user?.email && VIP_EMAILS.includes(user.email)
}

export async function isActiveSubscriber(orgId: string): Promise<boolean> {
  // L0: VIP bypass (testing/admin)
  if (await isVipBypass(orgId)) return true

  // L1: Cache Redis (mais rapido, evita qualquer query)
  const cached = await cacheGet<boolean>(`sub:${orgId}`)
  if (cached !== null) return cached

  const supabase = await createClient()

  // L2: Banco de dados (subscription_status salvo pelo webhook)
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_status')
    .eq('id', orgId)
    .maybeSingle()

  const dbStatus = (org as Record<string, unknown>)?.subscription_status as string | null

  if (dbStatus === 'active') {
    await cacheSet(`sub:${orgId}`, true, CACHE_TTL)
    return true
  }

  // Qualquer outro status (cancelled, null, etc.) = nao ativo
  await cacheSet(`sub:${orgId}`, false, CACHE_TTL)
  return false
}
