// =============================================================================
// DESTAKA — API Route: Content Pipeline (trigger manual)
// POST /api/content/generate
// Protegido por CRON_SECRET (mesmo padrao dos outros crons)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth } from '@/lib/cron-auth'
import { runContentPipeline } from '@/lib/content/orchestrator'
import { logger } from '@/lib/logger'

export const maxDuration = 300 // 5 minutos (pipeline e pesado)

export async function POST(request: NextRequest) {
  const authError = validateCronAuth(request)
  if (authError) return authError

  try {
    logger.info('api/content/generate', 'pipeline disparado manualmente')

    const report = await runContentPipeline()

    return NextResponse.json({
      ok: true,
      articlesGenerated: report.articlesGenerated,
      linkedinPostsGenerated: report.linkedinPostsGenerated,
      instagramPostsGenerated: report.instagramPostsGenerated,
      totalFiles: report.files.length,
      errors: report.errors,
      duration: `${((new Date(report.completedAt).getTime() - new Date(report.startedAt).getTime()) / 1000).toFixed(1)}s`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('api/content/generate', 'pipeline falhou', { err: message })

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    )
  }
}
