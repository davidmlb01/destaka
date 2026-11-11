import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { cacheGet, cacheSet } from '@/lib/redis'

const CACHE_TTL = 300 // 5 minutos

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Emails com acesso completo sem Stripe (testing/admin)
const VIP_EMAILS = (process.env.VIP_BYPASS_EMAILS ?? '').split(',').filter(Boolean)

export async function isVipBypass(orgId: string): Promise<boolean> {
  if (VIP_EMAILS.length === 0) return false
  const db = admin()
  const { data: prof } = await db
    .from('professionals')
    .select('user_id')
    .eq('organization_id', orgId)
    .maybeSingle()
  if (!prof?.user_id) return false
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user?.email && VIP_EMAILS.includes(user.email)
}

export async function isActiveSubscriber(orgId: string): Promise<boolean> {
  // L0: VIP bypass (testing/admin)
  if (await isVipBypass(orgId)) return true

  // L1: Cache Redis (mais rapido, evita qualquer query)
  const cached = await cacheGet<boolean>(`sub:${orgId}`)
  if (cached !== null) return cached

  const db = admin()

  // L2: Banco de dados (subscription_status salvo pelo webhook)
  const { data: org } = await db
    .from('organizations')
    .select('subscription_status')
    .eq('id', orgId)
    .maybeSingle()

  const dbStatus = (org as Record<string, unknown>)?.subscription_status as string | null
  const isActive = dbStatus === 'active' || dbStatus === 'trialing'

  await cacheSet(`sub:${orgId}`, isActive, CACHE_TTL)
  return isActive
}
