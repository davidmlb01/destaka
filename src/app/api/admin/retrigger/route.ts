export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '@/lib/inngest/client'
import { timingSafeEqual, createHmac } from 'crypto'
import { rateLimit } from '@/lib/redis'

function safeCompare(a: string, b: string): boolean {
  const ha = createHmac('sha256', 'destaka-admin').update(a).digest()
  const hb = createHmac('sha256', 'destaka-admin').update(b).digest()
  return timingSafeEqual(ha, hb)
}

// POST /api/admin/retrigger
// Dispara recalculo de score + auditoria + concorrentes para uma org ou todas
// Protegido por auth + role admin OU header x-admin-key
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const count = await rateLimit(`admin:retrigger:${ip}`, 3600)
  if (count === null) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  if (count >= 5) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const adminKey = req.headers.get('x-admin-key')
  const adminSecretKey = process.env.ADMIN_SECRET_KEY

  if (!adminSecretKey || adminSecretKey.length < 16) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  let isAuthorized = !!adminKey && safeCompare(adminKey, adminSecretKey)

  if (!isAuthorized) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const serviceDb = createAdminSupa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data: userData } = await serviceDb.from('users').select('role').eq('id', user.id).single()
      isAuthorized = userData?.role === 'admin'
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { organization_id?: string }

  const events = [
    { name: 'destaka/gbp.audit.requested' as const, data: body.organization_id ? { organization_id: body.organization_id } : {} },
    { name: 'destaka/score.calculate.requested' as const, data: body.organization_id ? { organization_id: body.organization_id } : {} },
    { name: 'destaka/competitors.discover.requested' as const, data: body.organization_id ? { organization_id: body.organization_id } : {} },
  ]

  await inngest.send(events)

  return NextResponse.json({
    ok: true,
    triggered: events.map(e => e.name),
    organization_id: body.organization_id ?? 'all',
  })
}
