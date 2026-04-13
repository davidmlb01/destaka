import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { refreshCompetitors, generateBenchmark } from '@/lib/gmb/competitors'

// POST /api/cron/competitor-tracker
// Vercel Cron: toda segunda-feira 9h
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await createServiceClient()

  const { data: profiles, error } = await db
    .from('gmb_profiles')
    .select('id, name')

  if (error || !profiles?.length) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const results: Array<{ profileId: string; refreshed: number; errors: string[] }> = []

  for (const profile of profiles) {
    const { refreshed, errors } = await refreshCompetitors(db, profile.id)
    if (refreshed > 0) await generateBenchmark(db, profile.id)
    results.push({ profileId: profile.id, refreshed, errors })
  }

  const totalRefreshed = results.reduce((sum, r) => sum + r.refreshed, 0)
  console.log(`[cron/competitor-tracker] refreshed=${totalRefreshed} profiles=${profiles.length}`)

  return NextResponse.json({ ok: true, profiles: profiles.length, totalRefreshed, results })
}
