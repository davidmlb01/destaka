import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateCronAuth } from '@/lib/cron-auth'
import { buildWeeklyReportData } from '@/lib/reports/weekly-data'
import { sendWeeklyReport } from '@/lib/email/weekly-report'
import { logger } from '@/lib/logger'

// POST /api/cron/weekly-report
// Vercel Cron: toda segunda-feira às 9h
// Compila dados da última semana e envia relatório por email
export async function POST(request: NextRequest) {
  const authError = validateCronAuth(request)
  if (authError) return authError

  const startedAt = Date.now()
  const db = createAdminClient()

  // Buscar perfis ativos de usuários pagos
  const { data: profiles, error: profilesError } = await db
    .from('gmb_profiles')
    .select('id, user_id')
    .not('user_id', 'is', null)

  if (profilesError) {
    logger.error('cron/weekly-report', 'erro ao buscar perfis', { err: profilesError.message })
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!profiles?.length) {
    logger.info('cron/weekly-report', 'nenhum perfil encontrado')
    return NextResponse.json({ ok: true, processed: 0 })
  }

  // Filtrar apenas usuários com plano pago
  const userIds = [...new Set(profiles.map(p => p.user_id))]
  const { data: paidUsers } = await db
    .from('users')
    .select('id')
    .in('id', userIds)
    .neq('plan', 'free')

  const paidUserIds = new Set((paidUsers ?? []).map(u => u.id))
  const activeProfiles = profiles.filter(p => paidUserIds.has(p.user_id))

  const results: Array<{ profileId: string; status: 'sent' | 'skip' | 'error'; error?: string }> = []

  for (const profile of activeProfiles) {
    try {
      const reportData = await buildWeeklyReportData(profile.id, db)

      if (!reportData) {
        results.push({ profileId: profile.id, status: 'skip' })
        continue
      }

      const { error: sendError } = await sendWeeklyReport(reportData)

      if (sendError) {
        logger.error('cron/weekly-report', 'erro ao enviar email', {
          profileId: profile.id,
          err: sendError.message,
        })
        results.push({ profileId: profile.id, status: 'error', error: sendError.message })
      } else {
        results.push({ profileId: profile.id, status: 'sent' })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error('cron/weekly-report', 'erro ao processar perfil', {
        profileId: profile.id,
        err: message,
      })
      results.push({ profileId: profile.id, status: 'error', error: message })
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

  logger.info('cron/weekly-report', 'concluído', summary)
  return NextResponse.json(summary)
}
