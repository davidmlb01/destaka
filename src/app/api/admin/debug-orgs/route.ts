import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY ?? ''

export async function GET(request: Request) {
  // Auth check
  const key = request.headers.get('x-admin-key') ?? new URL(request.url).searchParams.get('key')
  if (!key || key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [
    { data: orgs, error: orgsErr },
    { data: pros, error: prosErr },
    { data: scores, error: scoresErr },
    { data: tokens, error: tokensErr },
  ] = await Promise.all([
    db.from('organizations').select('id, name, specialty, subscription_status, lgpd_ai_consent, created_at, utm_source'),
    db.from('professionals').select('id, organization_id, user_id, full_name, email, created_at'),
    db.from('scores').select('organization_id, total, faixa, snapshot_date').order('snapshot_date', { ascending: false }).limit(20),
    db.from('google_tokens').select('organization_id, updated_at'),
  ])

  return NextResponse.json({
    organizations: { data: orgs, error: orgsErr?.message },
    professionals: { data: pros, error: prosErr?.message },
    recent_scores: { data: scores, error: scoresErr?.message },
    tokens: { data: tokens, error: tokensErr?.message },
  }, { status: 200 })
}
