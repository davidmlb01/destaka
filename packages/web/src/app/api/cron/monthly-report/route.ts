import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { compileMonthlyReport } from '@/lib/report/compiler'
import { sendMonthlyReport } from '@/lib/email/monthly-report'
import { validateCronAuth } from '@/lib/cron-auth'

// POST /api/cron/monthly-report
// Vercel Cron: dia 1 de cada mês às 8h
// Compila dados do mês anterior e envia relatório por email
export async function POST(request: NextRequest) {
  const authError = validateCronAuth(request)
  if (authError) return authError

  const startedAt = Date.now()
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { data: users, error: usersError } = await db
    .from('users')
    .select('id, email')
    .not('email', 'is', null)

  if (usersError) {
    console.error('[cron/monthly-report] users query error:', usersError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const results: Array<{ userId: string; status: 'sent' | 'skip' | 'error'; error?: string }> = []

  for (const user of users ?? []) {
    try {
      const reportData = await compileMonthlyReport(db, user.id)

      if (!reportData) {
        results.push({ userId: user.id, status: 'skip' })
        continue
      }

      const { error: sendError } = await sendMonthlyReport(reportData)

      if (sendError) {
        console.error(`[cron/monthly-report] send error user=${user.id}:`, sendError)

        await db.from('monthly_reports').upsert({
          user_id: user.id,
          profile_id: (await db.from('gmb_profiles').select('id').eq('user_id', user.id).single()).data?.id,
          month,
          year,
          data: reportData,
          email_status: `error: ${sendError.message}`,
        }, { onConflict: 'profile_id,month,year' })

        results.push({ userId: user.id, status: 'error', error: sendError.message })
      } else {
        const { data: profile } = await db
          .from('gmb_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          await db.from('monthly_reports').upsert({
            user_id: user.id,
            profile_id: profile.id,
            month,
            year,
            data: reportData,
            sent_at: new Date().toISOString(),
            email_status: 'sent',
          }, { onConflict: 'profile_id,month,year' })
        }

        results.push({ userId: user.id, status: 'sent' })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cron/monthly-report] error user=${user.id}:`, err)
      results.push({ userId: user.id, status: 'error', error: message })
    }
  }

  const summary = {
    ok: true,
    duration_ms: Date.now() - startedAt,
    processed: results.length,
    sent: results.filter(r => r.status === 'sent').length,
    skipped: results.filter(r => r.status === 'skip').length,
    errors: results.filter(r => r.status === 'error').length,
  }

  console.log('[cron/monthly-report] done:', summary)
  return NextResponse.json(summary)
}
