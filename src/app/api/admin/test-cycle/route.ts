export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import { rateLimit } from '@/lib/redis'

// POST /api/admin/test-cycle
// Dispara TODAS as funcoes Inngest para uma org especifica (teste end-to-end)
// Protegido por auth + VIP email
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const count = await rateLimit(`admin:test-cycle:${ip}`, 3600)
  if (count === null) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  if (count >= 3) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const adminKey = req.headers.get('x-admin-key')
  const adminSecretKey = process.env.ADMIN_SECRET_KEY
  const isAdminKey = !!adminKey && !!adminSecretKey && adminKey === adminSecretKey

  let orgId: string | undefined

  if (isAdminKey) {
    const body = await req.json().catch(() => ({})) as { organization_id?: string }
    orgId = body.organization_id
    // Sem org_id com admin key: busca todas as orgs com token
    if (!orgId) {
      const { createClient: createAdmin } = await import('@supabase/supabase-js')
      const db = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data: tokens } = await db.from('google_tokens').select('organization_id')
      const orgIds = (tokens ?? []).map((t: { organization_id: string }) => t.organization_id)
      if (orgIds.length === 0) return NextResponse.json({ error: 'Nenhuma org com token' }, { status: 404 })
      orgId = orgIds[0]
    }
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const vipEmails = (process.env.VIP_BYPASS_EMAILS ?? '').split(',').filter(Boolean)
    if (!vipEmails.includes(user.email)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as { organization_id?: string }
    orgId = body.organization_id
    if (!orgId) {
      const { data: prof } = await supabase
        .from('professionals')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()
      orgId = prof?.organization_id
    }
  }

  if (!orgId) {
    return NextResponse.json({ error: 'Nenhuma organizacao encontrada. Complete o onboarding primeiro.' }, { status: 400 })
  }

  const events = [
    { name: 'destaka/gbp.audit.requested' as const, data: { organization_id: orgId } },
    { name: 'destaka/score.calculate.requested' as const, data: { organization_id: orgId } },
    { name: 'destaka/geo.collect.requested' as const, data: { organization_id: orgId } },
    { name: 'destaka/keywords.snapshot.requested' as const, data: { organization_id: orgId } },
    { name: 'destaka/performance.collect.requested' as const, data: { organization_id: orgId } },
    { name: 'destaka/reviews.sync.requested' as const, data: {} },
    { name: 'destaka/gbp.optimize.requested' as const, data: { organization_id: orgId } },
    { name: 'destaka/post.generate.requested' as const, data: { organization_id: orgId } },
    { name: 'destaka/competitors.discover.requested' as const, data: { organization_id: orgId } },
  ]

  await inngest.send(events)

  return NextResponse.json({
    ok: true,
    organization_id: orgId,
    triggered: events.map(e => e.name),
    message: 'Ciclo completo disparado. Verifique o Inngest dashboard para acompanhar execucao.',
  })
}
