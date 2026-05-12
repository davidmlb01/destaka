// =============================================================================
// DESTAKA Content Pipeline — Orquestrador
// Conecta Research > Strategist > Writer e salva arquivos
// =============================================================================

import fs from 'fs'
import path from 'path'
import { runResearch } from './research'
import { buildEditorialCalendar } from './strategist'
import { writeArticle, writeLinkedInPost, writeInstagramCaption } from './writer'
import { logger } from '@/lib/logger'
import type { PipelineReport, DayBrief, SingleBrief } from './types'

const SERVICE = 'content/orchestrator'

const WEB_ROOT = process.cwd()
const POSTS_DIR = path.join(WEB_ROOT, 'content', 'posts')
const SOCIAL_DIR = path.join(WEB_ROOT, 'content', 'social')
const LLMS_TXT = path.join(WEB_ROOT, 'public', 'llms.txt')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * Gera slug a partir do titulo sugerido.
 */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/**
 * Atualiza public/llms.txt com novos artigos gerados.
 */
function updateLlmsTxt(newArticles: Array<{ title: string; slug: string; description: string }>) {
  let content = ''

  if (fs.existsSync(LLMS_TXT)) {
    content = fs.readFileSync(LLMS_TXT, 'utf-8')
  }

  // Verifica se ja tem secao de artigos
  const articlesHeader = '\n## Artigos recentes\n'
  if (!content.includes('## Artigos recentes')) {
    content += articlesHeader
  }

  // Adiciona novos artigos
  const newEntries = newArticles
    .map(
      (a) =>
        `- [${a.title}](https://destaka.com.br/blog/${a.slug}): ${a.description}`
    )
    .join('\n')

  // Insere apos o header de artigos
  const headerIdx = content.indexOf('## Artigos recentes')
  const afterHeader = content.indexOf('\n', headerIdx) + 1
  content =
    content.slice(0, afterHeader) +
    newEntries +
    '\n' +
    content.slice(afterHeader)

  fs.writeFileSync(LLMS_TXT, content, 'utf-8')
}

/**
 * Executa o pipeline completo de conteudo.
 * 1. Research (keywords)
 * 2. Strategist (pauta)
 * 3. Writer (artigos + social)
 * 4. Salva tudo em disco
 */
export async function runContentPipeline(): Promise<PipelineReport> {
  const startedAt = new Date().toISOString()
  const files: string[] = []
  const errors: string[] = []
  let articlesGenerated = 0
  let linkedinPostsGenerated = 0
  let instagramPostsGenerated = 0

  logger.info(SERVICE, 'pipeline iniciado')

  // ---- FASE 1: Research ----
  logger.info(SERVICE, 'fase 1: pesquisa de keywords')
  const keywords = await runResearch()

  if (keywords.length === 0) {
    throw new Error('Research retornou 0 keywords. Pipeline abortado.')
  }

  // ---- FASE 2: Estrategia ----
  logger.info(SERVICE, 'fase 2: construindo pauta editorial')
  const calendar = await buildEditorialCalendar(keywords, 15)

  // ---- FASE 3: Producao de conteudo ----
  logger.info(SERVICE, `fase 3: produzindo conteudo para ${calendar.days.length} dias`)

  ensureDir(POSTS_DIR)
  ensureDir(SOCIAL_DIR)

  const llmsEntries: Array<{ title: string; slug: string; description: string }> = []

  for (const day of calendar.days) {
    const dayLabel = `[${day.date}]`

    // --- Blog Articles (2 por dia) ---
    for (let idx = 0; idx < day.blogPosts.length; idx++) {
      const blogPost = day.blogPosts[idx]
      const linkedin = day.linkedinPosts[idx] ?? day.linkedinPosts[0]
      const brief: SingleBrief = {
        date: day.date,
        blogPost,
        linkedin,
        instagram: day.instagram,
      }

      try {
        logger.info(SERVICE, `${dayLabel} gerando artigo ${idx + 1}/${day.blogPosts.length}: ${blogPost.suggestedTitle}`)
        const mdx = await writeArticle(brief)

        const slug = extractSlugFromMdx(mdx) || toSlug(blogPost.suggestedTitle)
        const filename = `${slug}.mdx`
        const filepath = path.join(POSTS_DIR, filename)

        if (fs.existsSync(filepath)) {
          logger.warn(SERVICE, `${dayLabel} artigo ja existe: ${filename}`)
        } else {
          fs.writeFileSync(filepath, mdx, 'utf-8')
          files.push(`content/posts/${filename}`)
          articlesGenerated++

          llmsEntries.push({
            title: blogPost.suggestedTitle,
            slug,
            description: `Artigo sobre ${blogPost.keyword}`,
          })
        }
      } catch (err) {
        const msg = `${dayLabel} erro artigo ${idx + 1}: ${String(err)}`
        logger.error(SERVICE, msg)
        errors.push(msg)
      }
    }

    // --- LinkedIn Posts (2 por dia) ---
    for (let idx = 0; idx < day.linkedinPosts.length; idx++) {
      const linkedin = day.linkedinPosts[idx]
      const brief: SingleBrief = {
        date: day.date,
        blogPost: day.blogPosts[idx] ?? day.blogPosts[0],
        linkedin,
        instagram: day.instagram,
      }

      try {
        logger.info(SERVICE, `${dayLabel} gerando LinkedIn post ${idx + 1}/${day.linkedinPosts.length}`)
        const linkedinText = await writeLinkedInPost(brief)

        const linkedinFile = `${day.date}-linkedin-${idx + 1}.md`
        const linkedinPath = path.join(SOCIAL_DIR, linkedinFile)
        fs.writeFileSync(linkedinPath, linkedinText, 'utf-8')
        files.push(`content/social/${linkedinFile}`)
        linkedinPostsGenerated++
      } catch (err) {
        const msg = `${dayLabel} erro linkedin ${idx + 1}: ${String(err)}`
        logger.error(SERVICE, msg)
        errors.push(msg)
      }
    }

    // --- Instagram (apenas nos dias com post agendado) ---
    if (day.instagram) {
      const brief: SingleBrief = {
        date: day.date,
        blogPost: day.blogPosts[0],
        linkedin: day.linkedinPosts[0],
        instagram: day.instagram,
      }

      try {
        logger.info(SERVICE, `${dayLabel} gerando Instagram ${day.instagram.type}`)
        const igOutput = await writeInstagramCaption(brief)

        const igFile = `${day.date}-instagram.json`
        const igPath = path.join(SOCIAL_DIR, igFile)
        fs.writeFileSync(igPath, JSON.stringify(igOutput, null, 2), 'utf-8')
        files.push(`content/social/${igFile}`)
        instagramPostsGenerated++
      } catch (err) {
        const msg = `${dayLabel} erro instagram: ${String(err)}`
        logger.error(SERVICE, msg)
        errors.push(msg)
      }
    }

    // Pausa entre dias para nao estourar rate limits
    await new Promise<void>((r) => { setTimeout(r, 500) })
  }

  // ---- FASE 4: Atualiza llms.txt ----
  if (llmsEntries.length > 0) {
    try {
      updateLlmsTxt(llmsEntries)
      logger.info(SERVICE, `llms.txt atualizado com ${llmsEntries.length} entradas`)
    } catch (err) {
      errors.push(`erro ao atualizar llms.txt: ${String(err)}`)
    }
  }

  const report: PipelineReport = {
    startedAt,
    completedAt: new Date().toISOString(),
    calendar,
    articlesGenerated,
    linkedinPostsGenerated,
    instagramPostsGenerated,
    files,
    errors,
  }

  logger.info(SERVICE, 'pipeline concluido', {
    articlesGenerated,
    linkedinPostsGenerated,
    instagramPostsGenerated,
    totalFiles: files.length,
    totalErrors: errors.length,
  })

  return report
}

/**
 * Extrai slug do frontmatter de um MDX gerado.
 */
function extractSlugFromMdx(mdx: string): string | null {
  const match = mdx.match(/^slug:\s*"?([^"\n]+)"?/m)
  return match ? match[1].trim() : null
}
