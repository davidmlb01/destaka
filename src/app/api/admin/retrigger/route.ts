export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { inngest } from '@/lib/inngest/client'

// POST /api/admin/retrigger
// Dispara recalculo de score + descoberta de concorrentes para todas as orgs
// Protegido por header x-admin-key
export async function POST(req: Request) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { organization_id?: string }

  const events = [
    { name: 'destaka/score.calculate.requested' as const, data: body.organization_id ? { organization_id: body.organization_id } : {} },
    { name: 'destaka/competitors.discover.requested' as const, data: body.organization_id ? { organization_id: body.organization_id } : {} },
    { name: 'destaka/gbp.audit.requested' as const, data: body.organization_id ? { organization_id: body.organization_id } : {} },
  ]

  await inngest.send(events)

  return NextResponse.json({
    ok: true,
    triggered: events.map(e => e.name),
    organization_id: body.organization_id ?? 'all',
  })
}
