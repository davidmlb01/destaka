export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { probeAnalytics } from '@/lib/zernio/client'

// GET /api/admin/probe-zernio-analytics?org_id=xxx
// Testa se Zernio retorna analytics para uma org com account conectado.
// Protegido por x-admin-key.
export async function GET(req: Request) {
  const adminKey = req.headers.get('x-admin-key')
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const url = new URL(req.url)
  const orgId = url.searchParams.get('org_id')

  const db = createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Se org_id fornecido, testa uma org. Senao, testa todas com zernio_account_id.
  const orgs: Array<{ id: string; zernio_account_id: string }> = []

  if (orgId) {
    const { data } = await db
      .from('organizations')
      .select('id, zernio_account_id')
      .eq('id', orgId)
      .maybeSingle()
    if (data?.zernio_account_id) orgs.push(data as { id: string; zernio_account_id: string })
  } else {
    const { data } = await db
      .from('organizations')
      .select('id, zernio_account_id')
      .not('zernio_account_id', 'is', null)
    if (data) orgs.push(...(data as Array<{ id: string; zernio_account_id: string }>))
  }

  if (orgs.length === 0) {
    return NextResponse.json({
      message: 'Nenhuma org com zernio_account_id encontrada. Paula precisa autorizar Google via Zernio primeiro.',
      tested: 0,
    })
  }

  const results = []
  for (const org of orgs) {
    const probe = await probeAnalytics(org.zernio_account_id)
    results.push({
      org_id: org.id,
      zernio_account_id: org.zernio_account_id,
      analytics_available: probe.available,
      raw_response: probe.raw,
    })
  }

  return NextResponse.json({
    tested: results.length,
    results,
    next_steps: results.some(r => r.analytics_available)
      ? 'Analytics disponivel! Integrar no performance-collector.'
      : 'Analytics nao disponivel via Zernio. Avaliar alternativas (rank tracking, metricas proprias).',
  })
}
