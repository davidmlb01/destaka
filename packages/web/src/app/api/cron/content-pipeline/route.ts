// =============================================================================
// DESTAKA — Cron: Content Pipeline quinzenal
// POST /api/cron/content-pipeline
// Schedule: dia 1 e 15 de cada mes, 22h UTC (19h Brasilia)
//
// Executa o pipeline completo: Research > Strategist > Writer > GitHub commit.
// Se o pipeline ultrapassar o timeout, processa em batches:
//   - batch=1 (padrao): dias 1-8
//   - batch=2: dias 9-15
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth } from '@/lib/cron-auth'
import { runContentPipeline } from '@/lib/content/orchestrator'
import { commitContentFiles } from '@/lib/content/github-publisher'
import { logger } from '@/lib/logger'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300 // 5 minutos (limite Vercel Pro)

const SERVICE = 'cron/content-pipeline'

const WEB_ROOT = process.cwd()
const POSTS_DIR = path.join(WEB_ROOT, 'content', 'posts')
const SOCIAL_DIR = path.join(WEB_ROOT, 'content', 'social')

/**
 * Le arquivos gerados pelo pipeline e monta a lista para commit no GitHub.
 * O caminho no repo e relativo a raiz do monorepo (packages/web/...).
 */
function collectGeneratedFiles(relativePaths: string[]): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = []

  for (const rel of relativePaths) {
    const absPath = path.join(WEB_ROOT, rel)
    if (!fs.existsSync(absPath)) {
      logger.warn(SERVICE, `arquivo listado mas nao encontrado: ${rel}`)
      continue
    }
    const content = fs.readFileSync(absPath, 'utf-8')
    // Caminho no repo: packages/web/{rel}
    files.push({ path: `packages/web/${rel}`, content })
  }

  return files
}

export async function POST(request: NextRequest) {
  const authError = validateCronAuth(request)
  if (authError) return authError

  const startedAt = Date.now()
  const url = new URL(request.url)
  const batch = parseInt(url.searchParams.get('batch') ?? '0', 10)

  logger.info(SERVICE, 'cron content pipeline iniciado', {
    batch: batch || 'completo',
    timestamp: new Date().toISOString(),
  })

  try {
    // Executa o pipeline completo (research + strategist + writer)
    const report = await runContentPipeline()

    // Filtra arquivos por batch se necessario
    let filesToCommit = report.files
    if (batch === 1) {
      // Dias 1-8: filtra por data nos nomes dos arquivos
      filesToCommit = report.files.filter((f) => {
        const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})/)
        if (!dateMatch) return true // arquivos sem data (llms.txt etc)
        const dayOfPeriod = report.calendar.days.findIndex((d) => d.date === dateMatch[1])
        return dayOfPeriod >= 0 && dayOfPeriod < 8
      })
      logger.info(SERVICE, `batch 1: ${filesToCommit.length} de ${report.files.length} arquivos`)
    } else if (batch === 2) {
      filesToCommit = report.files.filter((f) => {
        const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})/)
        if (!dateMatch) return false // llms.txt ja foi no batch 1
        const dayOfPeriod = report.calendar.days.findIndex((d) => d.date === dateMatch[1])
        return dayOfPeriod >= 8
      })
      logger.info(SERVICE, `batch 2: ${filesToCommit.length} de ${report.files.length} arquivos`)
    }

    // Coleta conteudo dos arquivos gerados para commit via GitHub API
    const githubFiles = collectGeneratedFiles(filesToCommit)

    let commitResult: { commitSha: string; commitUrl: string } | null = null

    if (githubFiles.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const batchLabel = batch ? ` (batch ${batch})` : ''
      const commitMsg = `feat(content): pauta quinzenal ${today}${batchLabel}\n\n${report.articlesGenerated} artigos, ${report.linkedinPostsGenerated} LinkedIn, ${report.instagramPostsGenerated} Instagram`

      commitResult = await commitContentFiles(githubFiles, commitMsg)
      logger.info(SERVICE, 'commit realizado no GitHub', {
        sha: commitResult.commitSha.slice(0, 8),
        url: commitResult.commitUrl,
      })
    } else {
      logger.warn(SERVICE, 'nenhum arquivo gerado para commit')
    }

    const duration = ((Date.now() - startedAt) / 1000).toFixed(1)

    const summary = {
      ok: true,
      batch: batch || 'completo',
      duration: `${duration}s`,
      articlesGenerated: report.articlesGenerated,
      linkedinPostsGenerated: report.linkedinPostsGenerated,
      instagramPostsGenerated: report.instagramPostsGenerated,
      totalFiles: githubFiles.length,
      errors: report.errors,
      commit: commitResult
        ? { sha: commitResult.commitSha.slice(0, 8), url: commitResult.commitUrl }
        : null,
    }

    logger.info(SERVICE, 'cron content pipeline concluido', summary)
    return NextResponse.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const duration = ((Date.now() - startedAt) / 1000).toFixed(1)

    logger.error(SERVICE, 'cron content pipeline falhou', {
      err: message,
      duration: `${duration}s`,
    })

    return NextResponse.json(
      { ok: false, error: message, duration: `${duration}s` },
      { status: 500 }
    )
  }
}
