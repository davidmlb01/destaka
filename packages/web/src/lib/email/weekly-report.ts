// =============================================================================
// DESTAKA — Email do relatório semanal
// Template HTML + envio via Resend.
// =============================================================================

import { resend } from './index'
import type { WeeklyReportData } from '@/lib/reports/weekly-data'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

const BASE_STYLES = {
  body: 'margin:0;padding:0;background:#f5f5f4;font-family:Inter,Arial,sans-serif;',
  outer: 'background:#f5f5f4;padding:32px 0;',
  card: 'background:#ffffff;border-radius:16px;overflow:hidden;',
  header: 'background:linear-gradient(135deg,#161B26,#0F1117);padding:32px 40px;text-align:center;',
  body_cell: 'padding:40px;',
  footer: 'padding:24px 40px;border-top:1px solid #e7e5e4;text-align:center;',
  cta: 'display:inline-block;background:#0284C7;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;',
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${BASE_STYLES.body}">
  <table width="100%" cellpadding="0" cellspacing="0" style="${BASE_STYLES.outer}">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="${BASE_STYLES.card}">
        <tr><td style="${BASE_STYLES.header}">
          <p style="margin:0;color:#0EA5E9;font-size:24px;">✦</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
            Desta<span style="color:#0EA5E9;">ka</span>
          </p>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Resumo semanal</p>
        </td></tr>
        <tr><td style="${BASE_STYLES.body_cell}">${content}</td></tr>
        <tr><td style="${BASE_STYLES.footer}">
          <p style="margin:0;font-size:12px;color:#a8a29e;">Você cuida dos seus pacientes. O Destaka cuida do seu Google.</p>
          <p style="margin:4px 0 0;font-size:11px;color:#d6d3d1;">destaka.com.br</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Helpers de copy ──────────────────────────────────────────────────────────

function scoreBadge(delta: number): string {
  if (delta > 0) return `<span style="color:#22c55e;font-weight:700;">+${delta} pontos</span>`
  if (delta < 0) return `<span style="color:#ef4444;font-weight:700;">${delta} pontos</span>`
  return `<span style="color:#6b7280;font-weight:700;">estável</span>`
}

function topicLabel(topic: string): string {
  const map: Record<string, string> = {
    update: 'Novidade',
    offer: 'Oferta',
    event: 'Evento',
    tip: 'Dica',
  }
  return map[topic] ?? topic
}

function actionsSection(data: WeeklyReportData): string {
  const items: string[] = []

  if (data.posts_published > 0) {
    const topics = data.posts_topics.length > 0
      ? ` (${data.posts_topics.map(topicLabel).join(', ')})`
      : ''
    items.push(`<strong>${data.posts_published} post${data.posts_published > 1 ? 's' : ''}</strong> publicado${data.posts_published > 1 ? 's' : ''} no seu nome${topics}`)
  } else {
    items.push('Nenhum post publicado esta semana')
  }

  if (data.reviews_replied > 0) {
    items.push(`<strong>${data.reviews_replied} avaliação${data.reviews_replied > 1 ? 'ões' : ''}</strong> respondida${data.reviews_replied > 1 ? 's' : ''} automaticamente`)
  }

  return items.map(item =>
    `<tr>
      <td style="padding:0 8px 0 0;vertical-align:top;color:#0EA5E9;font-size:16px;line-height:1.6;">✓</td>
      <td style="padding:0 0 10px;color:#57534e;font-size:15px;line-height:1.6;">${item}</td>
    </tr>`
  ).join('')
}

function pendingSection(data: WeeklyReportData): string {
  if (data.reviews_pending_approval === 0) return ''

  return `
    <div style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:10px;padding:16px 20px;margin:24px 0 0;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#9A3412;">
        ${data.reviews_pending_approval} resposta${data.reviews_pending_approval > 1 ? 's aguardando' : ' aguardando'} sua aprovação
      </p>
      <p style="margin:0;font-size:13px;color:#C2410C;line-height:1.5;">
        O Destaka preparou respostas para essas avaliações. Revise e aprove no painel.
      </p>
    </div>
  `
}

function alertsSection(data: WeeklyReportData): string {
  if (data.alerts_count === 0) return ''

  return `
    <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px;padding:16px 20px;margin:24px 0 0;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#991B1B;">
        ${data.alerts_count} alerta${data.alerts_count > 1 ? 's' : ''} de perfil detectado${data.alerts_count > 1 ? 's' : ''}
      </p>
      <p style="margin:0;font-size:13px;color:#B91C1C;line-height:1.5;">
        Alterações foram identificadas no seu perfil do Google. Verifique no painel se foram autorizadas.
      </p>
    </div>
  `
}

// ── Build HTML ───────────────────────────────────────────────────────────────

export function buildWeeklyReportHtml(data: WeeklyReportData): string {
  const firstName = data.user_name.split(' ')[0]

  const content = `
    <p style="margin:0 0 8px;font-size:16px;color:#57534e;">Olá, ${firstName}!</p>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1c1917;letter-spacing:-0.5px;">
      Seu assistente digital trabalhou esta semana
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#a8a29e;">
      ${data.profile_name}
    </p>

    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1c1917;text-transform:uppercase;letter-spacing:0.06em;">
      Ações realizadas
    </p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
      ${actionsSection(data)}
    </table>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1c1917;text-transform:uppercase;letter-spacing:0.06em;">
        Score Destaka
      </p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <span style="font-size:40px;font-weight:900;color:#1c1917;letter-spacing:-1px;">${data.score_current}</span>
            <span style="font-size:16px;color:#d6d3d1;">/100</span>
          </td>
          <td style="text-align:right;padding:8px 0;">
            <p style="margin:0;font-size:14px;">vs. semana anterior: ${scoreBadge(data.score_delta)}</p>
          </td>
        </tr>
      </table>
    </div>

    ${pendingSection(data)}
    ${alertsSection(data)}

    <table cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
      <tr><td>
        <a href="${APP_URL}/saude/dashboard" style="${BASE_STYLES.cta}">Ver detalhes no painel</a>
      </td></tr>
    </table>
  `

  return baseLayout(content)
}

// ── Envio ────────────────────────────────────────────────────────────────────

export async function sendWeeklyReport(data: WeeklyReportData) {
  const html = buildWeeklyReportHtml(data)

  return resend.emails.send({
    from: 'Destaka <relatorio@destaka.com.br>',
    to: data.user_email,
    subject: 'Destaka Saúde: resumo da sua semana',
    html,
  })
}
