import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { refreshCompetitors, generateBenchmark } from '@/lib/gmb/competitors'
import { validateCronAuth } from '@/lib/cron-auth'

// POST /api/cron/competitor-tracker
// Vercel Cron: toda segunda-feira 9h
export async function POST(request: NextRequest) {
  const authError = validateCronAuth(request)
  if (authError) return authError

  const db = await createServiceClient()

  const { data: profiles, error } = await db
    .from('gmb_profiles')
    .select('id, name')

  if (error || !profiles?.length) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const results: Array<{ profileId: string; refreshed: number; errors: string[] }> = []

  for (const profile of profiles) {
    try {
      const { refreshed, errors } = await refreshCompetitors(db, profile.id)
      if (refreshed > 0) await generateBenchmark(db, profile.id)
      results.push({ profileId: profile.id, refreshed, errors })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cron/competitor-tracker] erro no perfil=${profile.id}:`, err)
      results.push({ profileId: profile.id, refreshed: 0, errors: [message] })
    }
  }

  const totalRefreshed = results.reduce((sum, r) => sum + r.refreshed, 0)
  console.log(`[cron/competitor-tracker] refreshed=${totalRefreshed} profiles=${profiles.length}`)

  return NextResponse.json({ ok: true, profiles: profiles.length, totalRefreshed, results })
}
