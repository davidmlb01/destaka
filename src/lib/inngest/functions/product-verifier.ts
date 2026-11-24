// Pecanha Agent: Product Verification — verifica que todos os sistemas automatizados
// estao entregando valor para todos os usuarios ativos.
// Crono: 10h e 16h BRT (13h e 19h UTC) seg-sex + relatorio semanal sexta 17h BRT

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { resend, FROM } from '@/lib/email/index'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Destinatario dos alertas de verificacao (David / admin)
const ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL ?? 'david@destaka.com.br'

type CheckStatus = 'ok' | 'warning' | 'failed'

interface CheckItem {
  status: CheckStatus
  message: string
}

interface OrgReport {
  orgId: string
  orgName: string
  posts: CheckItem[]
  reviews: CheckItem[]
  score: CheckItem[]
  optimizations: CheckItem[]
}

// Determina o tipo de verificacao com base no dia e hora UTC
function resolveCheckType(now: Date): 'full' | 'quick' | 'reviews-only' | 'weekly-report' {
  const day = now.getUTCDay() // 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab
  const hour = now.getUTCHours()

  // Sexta 20h UTC (17h BRT) = relatorio semanal
  if (day === 5 && hour >= 19) return 'weekly-report'

  // Segunda 13h UTC (10h BRT) = verificacao completa (posts + reviews + score + otimizacoes)
  if (day === 1 && hour < 15) return 'full'

  // Ter-Sex 13h UTC (10h BRT) = verificacao rapida (reviews + score)
  if (day >= 2 && day <= 5 && hour < 15) return 'quick'

  // 19h UTC (16h BRT) = segunda verificacao de reviews
  if (hour >= 19) return 'reviews-only'

  return 'quick'
}

// Calcula inicio da semana (segunda-feira 00:00 UTC)
function getMondayUTC(now: Date): Date {
  const d = new Date(now)
  d.setUTCHours(0, 0, 0, 0)
  const dayOffset = (d.getUTCDay() + 6) % 7 // 0=seg...6=dom
  d.setUTCDate(d.getUTCDate() - dayOffset)
  return d
}

// Verifica posts gerados esta semana para uma org
async function checkPosts(
  db: ReturnType<typeof admin>,
  orgId: string
): Promise<CheckItem[]> {
  const items: CheckItem[] = []
  const now = new Date()
  const monday = getMondayUTC(now)
  const friday = new Date(monday)
  friday.setUTCDate(monday.getUTCDate() + 5)

  // Conta posts desta semana
  const { data: posts, error } = await db
    .from('posts')
    .select('id, content, scheduled_at, status, keywords')
    .eq('organization_id', orgId)
    .gte('created_at', monday.toISOString())
    .in('status', ['pending', 'scheduled', 'published'])

  if (error) {
    items.push({ status: 'failed', message: `Erro ao consultar posts: ${error.message}` })
    return items
  }

  const count = (posts ?? []).length
  if (count >= 5) {
    items.push({ status: 'ok', message: `${count}/5 posts gerados com agenda seg-sex` })
  } else if (count > 0) {
    items.push({ status: 'warning', message: `Apenas ${count}/5 posts gerados esta semana` })
  } else {
    items.push({ status: 'failed', message: 'Nenhum post gerado esta semana' })
  }

  // Verifica scheduled_at
  const semScheduled = (posts ?? []).filter(p => !p.scheduled_at)
  if (semScheduled.length > 0) {
    items.push({
      status: 'warning',
      message: `${semScheduled.length} post(s) sem scheduled_at definido`,
    })
  }

  // Verifica keywords nos posts (bairros)
  const semKeyword = (posts ?? []).filter(p => {
    if (!p.content) return true
    // Verifica se ha algum nome de bairro ou keyword no conteudo
    const hasKeyword =
      (p.keywords && Array.isArray(p.keywords) && p.keywords.length > 0) ||
      /copacabana|ipanema|leblon|botafogo|flamengo|leme|urca|catete|laranjeiras|lagoa|galea|tijuca|centro/i.test(
        p.content
      )
    return !hasKeyword
  })
  if (semKeyword.length > 0) {
    items.push({
      status: 'warning',
      message: `${semKeyword.length} post(s) sem keyword de bairro no conteudo`,
    })
  } else if ((posts ?? []).length > 0) {
    items.push({ status: 'ok', message: 'Keywords de bairro presentes nos posts' })
  }

  return items
}

// Verifica reviews e respostas para uma org
async function checkReviews(
  db: ReturnType<typeof admin>,
  orgId: string
): Promise<CheckItem[]> {
  const items: CheckItem[] = []
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  // Reviews sem resposta nos ultimos 30 dias
  const { data: reviewsSemResposta } = await db
    .from('reviews')
    .select('id, created_at')
    .eq('organization_id', orgId)
    .gte('review_date', thirtyDaysAgo.toISOString())
    .is('review_reply', null)

  const semResposta = (reviewsSemResposta ?? []).length
  if (semResposta === 0) {
    items.push({ status: 'ok', message: '0 reviews sem resposta nos ultimos 30 dias' })
  } else {
    items.push({
      status: 'warning',
      message: `${semResposta} review(s) sem resposta nos ultimos 30 dias`,
    })
  }

  // Respostas pendentes ha mais de 48h (review_responses com status pending)
  const { data: pendentes } = await db
    .from('review_responses')
    .select('id, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .lt('created_at', twoDaysAgo.toISOString())

  const totalPendentes = (pendentes ?? []).length
  if (totalPendentes > 0) {
    items.push({
      status: 'warning',
      message: `${totalPendentes} resposta(s) pendentes ha mais de 48h sem notificacao`,
    })
  }

  // Verifica quando o review-monitor rodou pela ultima vez
  // Proxy: score_history updated_at mais recente (crons rodam em serie)
  const { data: lastScore } = await db
    .from('score_history')
    .select('calculated_at')
    .eq('organization_id', orgId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastScore?.calculated_at) {
    const lastRun = new Date(lastScore.calculated_at)
    const horasPassadas = (Date.now() - lastRun.getTime()) / 3600000
    if (horasPassadas > 6) {
      items.push({
        status: 'warning',
        message: `Monitor possivelmente inativo: ultima atividade ha ${Math.round(horasPassadas)}h`,
      })
    } else {
      items.push({
        status: 'ok',
        message: `Monitor ativo (ultima atividade ha ${Math.round(horasPassadas)}h)`,
      })
    }
  }

  return items
}

// Verifica score calculado hoje para uma org
async function checkScore(
  db: ReturnType<typeof admin>,
  orgId: string
): Promise<CheckItem[]> {
  const items: CheckItem[] = []
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const { data: score } = await db
    .from('score_history')
    .select('total_score, calculated_at')
    .eq('organization_id', orgId)
    .gte('calculated_at', today.toISOString())
    .order('calculated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!score) {
    items.push({ status: 'failed', message: 'Score nao calculado hoje' })
  } else if (score.total_score <= 0) {
    items.push({
      status: 'failed',
      message: `Score calculado hoje mas com valor invalido: ${score.total_score}`,
    })
  } else {
    items.push({
      status: 'ok',
      message: `Score ${score.total_score} calculado hoje`,
    })
  }

  return items
}

// Verifica relatorios de otimizacao para uma org
async function checkOptimizations(
  db: ReturnType<typeof admin>,
  orgId: string
): Promise<CheckItem[]> {
  const items: CheckItem[] = []

  const { data: report } = await db
    .from('optimization_reports')
    .select('id, created_at, applied_sections')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!report) {
    items.push({ status: 'warning', message: 'Nenhum relatorio de otimizacao encontrado' })
    return items
  }

  items.push({ status: 'ok', message: 'Relatorio de otimizacao existe' })

  // Verifica applied_sections (nao deve estar marcando itens nao aplicados)
  const applied = Array.isArray(report.applied_sections) ? report.applied_sections : []
  if (applied.length > 0) {
    items.push({
      status: 'ok',
      message: `${applied.length} secao(oes) marcadas como aplicadas`,
    })
  }

  return items
}

// Monta secao HTML por org para o email
function buildOrgSection(report: OrgReport, includeOptimizations: boolean): string {
  const icon: Record<CheckStatus, string> = {
    ok: 'OK',
    warning: 'AVISO',
    failed: 'FALHA',
  }

  const renderItems = (items: CheckItem[]) =>
    items
      .map(i => `  ${icon[i.status]} ${i.message}`)
      .join('\n')

  let sections = `\n=== ORG: ${report.orgName} ===\n`

  if (report.posts.length > 0) {
    sections += `\nPOSTS (segunda)\n${renderItems(report.posts)}\n`
  }

  if (report.reviews.length > 0) {
    sections += `\nREVIEWS\n${renderItems(report.reviews)}\n`
  }

  if (report.score.length > 0) {
    sections += `\nSCORE\n${renderItems(report.score)}\n`
  }

  if (includeOptimizations && report.optimizations.length > 0) {
    sections += `\nOTIMIZACOES\n${renderItems(report.optimizations)}\n`
  }

  return sections
}

// Conta totais de ok/warning/failed em todos os checks de um relatorio
function countTotals(report: OrgReport) {
  const all = [
    ...report.posts,
    ...report.reviews,
    ...report.score,
    ...report.optimizations,
  ]
  return {
    ok: all.filter(i => i.status === 'ok').length,
    warnings: all.filter(i => i.status === 'warning').length,
    failed: all.filter(i => i.status === 'failed').length,
  }
}

export const productVerifier = inngest.createFunction(
  {
    id: 'product-verifier',
    triggers: [
      { cron: '0 13,19 * * 1-5' }, // 10h e 16h BRT (13h e 19h UTC), seg-sex
      { cron: '0 20 * * 5' },       // Sexta 17h BRT (20h UTC): relatorio semanal
      { event: 'destaka/product.verify.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()
    const now = new Date()
    const checkType = resolveCheckType(now)

    console.log(`[product-verifier] Iniciando verificacao tipo="${checkType}" em ${now.toISOString()}`)

    // Busca todas as orgs ativas
    const orgs: Array<{ id: string; name: string }> = await step.run('resolve-orgs', async () => {
      // Permite disparar para uma org especifica via evento
      const eventData = (event as unknown as { data?: { organization_id?: string } }).data
      if (
        event.name === 'destaka/product.verify.requested' &&
        eventData?.organization_id
      ) {
        const { data } = await db
          .from('organizations')
          .select('id, name')
          .eq('id', eventData.organization_id)
        return data ?? []
      }
      const { data } = await db.from('organizations').select('id, name')
      return data ?? []
    })

    if (orgs.length === 0) {
      console.log('[product-verifier] Nenhuma org encontrada. Encerrando.')
      return { status: 'skip', reason: 'nenhuma org ativa' }
    }

    const reports: OrgReport[] = []

    for (const org of orgs) {
      const report = await step.run(`verify-org-${org.id}`, async () => {
        const orgReport: OrgReport = {
          orgId: org.id,
          orgName: org.name,
          posts: [],
          reviews: [],
          score: [],
          optimizations: [],
        }

        // Posts: apenas na verificacao completa (segunda-feira manha)
        if (checkType === 'full') {
          orgReport.posts = await checkPosts(db, org.id)
        }

        // Reviews: em todos os tipos de verificacao
        if (checkType !== 'weekly-report') {
          orgReport.reviews = await checkReviews(db, org.id)
        }

        // Score: na verificacao completa e rapida (manhã)
        if (checkType === 'full' || checkType === 'quick') {
          orgReport.score = await checkScore(db, org.id)
        }

        // Otimizacoes: apenas na verificacao completa
        if (checkType === 'full') {
          orgReport.optimizations = await checkOptimizations(db, org.id)
        }

        return orgReport
      })

      reports.push(report)
    }

    // Monta relatorio agregado
    const emailResult = await step.run('send-verification-email', async () => {
      const dataBR = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      const horaBR = now.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      })

      const isWeekly = checkType === 'weekly-report'
      const subject = isWeekly
        ? `[Destaka] Relatorio semanal - ${dataBR}`
        : `[Destaka] Verificacao diaria - ${dataBR} ${horaBR}`

      const includeOptimizations = checkType === 'full'

      let body = isWeekly
        ? `RELATORIO SEMANAL DE PRODUTO - ${dataBR}\n`
        : `VERIFICACAO DE PRODUTO - ${dataBR} ${horaBR}\n`

      body += `Tipo: ${checkType} | Orgs verificadas: ${orgs.length}\n`

      let totalOk = 0
      let totalWarnings = 0
      let totalFailed = 0

      for (const report of reports) {
        body += buildOrgSection(report, includeOptimizations)
        const totals = countTotals(report)
        totalOk += totals.ok
        totalWarnings += totals.warnings
        totalFailed += totals.failed
      }

      body += `\n=== RESUMO ===\n${totalOk} OK | ${totalWarnings} AVISOS | ${totalFailed} FALHAS\n`

      if (totalFailed === 0 && totalWarnings === 0) {
        body += '\nTudo funcionando corretamente.\n'
      } else if (totalFailed > 0) {
        body += `\n${totalFailed} falha(s) identificada(s). Pecanha despachou correcao automatica.\n`
      }

      console.log(`[product-verifier] ${body}`)

      // Monta HTML simples para o email
      const htmlBody = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#111827;border-radius:16px 16px 0 0;padding:24px 32px;">
          <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.015em;">Destaka</span>
          <span style="font-size:14px;color:#9ca3af;margin-left:12px;">Verificacao de Produto</span>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px;">
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#111827;">${subject.replace('[Destaka] ', '')}</h2>
          <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">${dataBR} ${horaBR} &mdash; ${orgs.length} org(s) verificada(s)</p>
          <div style="background:#f9fafb;border-radius:8px;padding:20px;font-family:monospace;font-size:13px;color:#374151;white-space:pre-wrap;line-height:1.6;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          ${totalFailed > 0
            ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-top:20px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#dc2626;">${totalFailed} falha(s) identificada(s). Verificar dashboard imediatamente.</p>
               </div>`
            : totalWarnings > 0
            ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-top:20px;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#d97706;">${totalWarnings} aviso(s). Monitorar nas proximas horas.</p>
               </div>`
            : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-top:20px;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#16a34a;">Todos os sistemas operando normalmente.</p>
               </div>`
          }
        </td></tr>
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="font-size:11px;color:#9ca3af;margin:0;">Destaka &mdash; Verificacao automatica por Pecanha</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

      await resend.emails.send({
        from: FROM,
        to: ALERT_EMAIL,
        subject,
        html: htmlBody,
      })

      return {
        subject,
        orgs_checked: orgs.length,
        total_ok: totalOk,
        total_warnings: totalWarnings,
        total_failed: totalFailed,
        body_text: body,
      }
    })

    // Despacho automatico: Pecanha identifica o problema e aciona a correcao
    // Dispara eventos Inngest para que as funcoes responsaveis refacam o trabalho
    const dispatched = await step.run('dispatch-fixes', async () => {
      const fixes: string[] = []

      for (const report of reports) {
        const { orgId } = report

        // Posts faltando: re-disparar post-generator
        const postsFailed = report.posts.some(p => p.status === 'failed' && p.message.includes('Nenhum post'))
        const postsIncomplete = report.posts.some(p => p.status === 'warning' && p.message.includes('Apenas'))
        if (postsFailed || postsIncomplete) {
          await inngest.send({
            name: 'destaka/post.generate.requested',
            data: { organization_id: orgId, triggered_by: 'pecanha' },
          })
          fixes.push(`${report.orgName}: re-disparado post-generator`)
        }

        // Reviews sem resposta: re-disparar review-monitor
        const reviewsFailing = report.reviews.some(p =>
          (p.status === 'warning' || p.status === 'failed') && p.message.includes('sem resposta')
        )
        if (reviewsFailing) {
          await inngest.send({
            name: 'destaka/reviews.sync.requested',
            data: { organization_id: orgId, triggered_by: 'pecanha' },
          })
          fixes.push(`${report.orgName}: re-disparado review-monitor`)
        }

        // Score nao calculado: re-disparar score-calculator
        const scoreFailed = report.score.some(p => p.status === 'failed')
        if (scoreFailed) {
          await inngest.send({
            name: 'destaka/score.calculate.requested',
            data: { organization_id: orgId, triggered_by: 'pecanha' },
          })
          fixes.push(`${report.orgName}: re-disparado score-calculator`)
        }
      }

      if (fixes.length > 0) {
        console.log(`[product-verifier] Pecanha despachou ${fixes.length} correcao(oes): ${fixes.join('; ')}`)
      }

      return fixes
    })

    // Se houve despachos, envia email complementar ao David com as acoes tomadas
    if (dispatched.length > 0) {
      await step.run('send-dispatch-email', async () => {
        const dataBR = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        const dispatchList = dispatched.map(d => `  - ${d}`).join('\n')

        await resend.emails.send({
          from: FROM,
          to: ALERT_EMAIL,
          subject: `[Destaka] Pecanha despachou ${dispatched.length} correcao(oes) - ${dataBR}`,
          html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#111827;border-radius:16px 16px 0 0;padding:24px 32px;">
          <span style="font-size:18px;font-weight:700;color:#ffffff;">Destaka</span>
          <span style="font-size:14px;color:#F59E0B;margin-left:12px;">Pecanha: correcoes despachadas</span>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px;">
          <h2 style="margin:0 0 16px;font-size:18px;font-weight:800;color:#111827;">Problemas detectados e correcoes acionadas</h2>
          <p style="margin:0 0 16px;font-size:14px;color:#4b5563;">Pecanha identificou problemas e despachou automaticamente para os responsaveis:</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;font-family:monospace;font-size:13px;color:#374151;white-space:pre-wrap;line-height:1.8;">${dispatchList}</div>
          <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">As funcoes responsaveis foram re-disparadas via Inngest. Os resultados aparecem na proxima verificacao.</p>
        </td></tr>
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="font-size:11px;color:#9ca3af;margin:0;">Destaka: Pecanha, agente de verificacao de produto</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        })
      })
    }

    return {
      check_type: checkType,
      ...emailResult,
      dispatched,
      reports: reports.map(r => ({
        org_id: r.orgId,
        org_name: r.orgName,
        totals: countTotals(r),
      })),
    }
  }
)
// trigger redeploy
