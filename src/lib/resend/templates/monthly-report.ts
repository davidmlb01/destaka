// Template HTML do relatório mensal recorrente (mês 2+)
// Todos os dados devem vir do cliente. Proibido inventar ou usar dados genéricos.
import type { MonthlyReportData } from '@/lib/report/report-compiler'
import { escapeHtml } from '@/lib/utils/escape-html'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'
const SUPPORT_EMAIL = 'suporte@destaka.com.br'

const FAIXA_COLOR: Record<string, string> = {
  fraca: '#dc2626',
  funcional: '#d97706',
  forte: '#16a34a',
  perfeita: '#2563eb',
}

const FAIXA_BADGE_TEXT: Record<string, string> = {
  fraca: '#991b1b',
  funcional: '#92400e',
  forte: '#166534',
  perfeita: '#1e40af',
}

const FAIXA_LABEL: Record<string, string> = {
  fraca: 'Presença Fraca',
  funcional: 'Presença Funcional',
  forte: 'Presença Forte',
  perfeita: 'Presença Perfeita',
}

function scoreBar(value: number, max: number, color: string): string {
  const pct = Math.round((value / max) * 100)
  return `
    <div style="background:#e5e7eb;border-radius:4px;height:8px;margin-top:6px;">
      <div style="background:${color};width:${pct}%;height:8px;border-radius:4px;"></div>
    </div>
    <p style="font-size:12px;color:#6b7280;margin:3px 0 0;">${value} de ${max} pts</p>
  `
}

function subjectLine(data: MonthlyReportData): string {
  const firstName = escapeHtml(data.professional_name.split(' ')[0])

  if (data.score_delta > 5) {
    return `${firstName}, +${data.score_delta} pontos em ${data.month_label}. Seus números estão aqui.`
  }
  if (data.score_delta > 0) {
    return `${firstName}, seu perfil cresceu em ${data.month_label}. Veja os resultados.`
  }
  if (data.score_delta < 0) {
    return `${firstName}, seu relatório de ${data.month_label} está pronto. Já temos o plano.`
  }
  return `${firstName}, ${data.month_label} fechou. ${data.reviews_new_this_month > 0 ? `${data.reviews_new_this_month} pacientes avaliaram você.` : 'Veja o resumo completo.'}`
}

function heroHeadline(data: MonthlyReportData): string {
  const firstName = escapeHtml(data.professional_name.split(' ')[0])

  if (data.score_delta > 5) return `${firstName}, mês forte.`
  if (data.score_delta > 0) return `${firstName}, progresso consistente em ${data.month_label}.`
  if (data.score_delta < 0) return `${firstName}, vamos corrigir a rota.`
  return `${firstName}, seu ${data.month_label} no detalhe.`
}

function scoreDeltaCopy(data: MonthlyReportData): string {
  if (data.score_delta > 5) return `Você subiu <strong>${data.score_delta} pontos</strong> em relação ao mês anterior. Ritmo forte.`
  if (data.score_delta > 0) return `Alta de <strong>${data.score_delta} pontos</strong> em relação ao mês passado. Progresso constante.`
  if (data.score_delta < 0) return `Queda de <strong>${Math.abs(data.score_delta)} pontos</strong> neste mês. O plano de correção já está definido.`
  return `Estável em relação ao mês anterior. Vamos buscar o próximo salto.`
}

function daysAsCustomerCopy(days: number): string {
  if (days < 90) return `Você começou há ${days} dias. Os primeiros 90 dias são os que mais movem o ponteiro. Cada semana conta.`
  if (days < 180) return `${days} dias trabalhando no seu Google. O perfil já tem consistência. Agora é escalar.`
  if (days < 365) return `Meio ano de presença ativa. Perfis com essa constância são os que dominam a busca local.`
  return `Mais de um ano juntos. Seu perfil tem algo que a maioria não tem: histórico. O Google valoriza isso.`
}

function reputationInsight(data: MonthlyReportData): string {
  const rate = Math.round(data.response_rate * 100)
  const lines: string[] = []

  if (data.reviews_new_this_month === 0) {
    lines.push('Nenhuma avaliação nova este mês. Incentivar pacientes a avaliar pode mudar esse número rapidamente.')
  } else if (data.reviews_new_this_month === 1) {
    lines.push('1 paciente avaliou você este mês. Cada avaliação conta para o Google te mostrar mais.')
  } else {
    lines.push(`${data.reviews_new_this_month} pacientes avaliaram você. Isso alimenta diretamente sua posição no Maps.`)
  }

  if (rate >= 80) {
    lines.push(`Você respondeu ${rate}% das avaliações. Pacientes percebem esse cuidado.`)
  } else if (rate >= 50) {
    lines.push(`${rate}% de taxa de resposta. Responder a todos aumenta sua nota de relevância no Google.`)
  } else if (rate > 0) {
    lines.push(`Apenas ${rate}% das avaliações foram respondidas. Cada resposta é sinal de atividade para o algoritmo.`)
  }

  return lines.join(' ')
}

function postsInsight(data: MonthlyReportData): string {
  if (data.posts_published_this_month === 0) {
    return 'Nenhum post foi publicado este mês. Posts regulares mantêm seu perfil ativo para o Google.'
  }
  if (data.posts_published_this_month <= 2) {
    return `${data.posts_published_this_month} post${data.posts_published_this_month > 1 ? 's publicados' : ' publicado'} no seu nome. O ideal é manter pelo menos 2 por semana para sinalizar atividade ao Google.`
  }
  return `${data.posts_published_this_month} posts publicados no seu nome. Seu perfil ficou ativo para o Google durante o mês inteiro.`
}

function engagementInsight(data: MonthlyReportData): string {
  const total = (data.website_clicks ?? 0) + (data.phone_clicks ?? 0) + (data.whatsapp_clicks ?? 0)
  if (total > 0) {
    return `${total} pessoas tomaram uma ação direta depois de ver seu perfil. Essas são pessoas que estavam procurando exatamente o que você oferece.`
  }
  if ((data.profile_views ?? 0) > 0) {
    return `${data.profile_views} pessoas viram seu perfil. Melhorar fotos, descrição e avaliações acelera a conversão em contato direto.`
  }
  return ''
}

export function buildMonthlyReportEmail(data: MonthlyReportData): { subject: string; html: string } {
  const color = FAIXA_COLOR[data.score_faixa] ?? '#6b7280'
  const faixaLabel = FAIXA_LABEL[data.score_faixa] ?? 'Presença'
  const badgeTextColor = FAIXA_BADGE_TEXT[data.score_faixa] ?? color
  const responseRatePct = Math.round(data.response_rate * 100)
  const totalDelta = data.score_current - (data.score_initial ?? data.score_previous)
  const engInsight = engagementInsight(data)

  const subject = subjectLine(data)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Destaka Saúde ${data.month_label} ${data.year}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
  <tr><td align="center">
  <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

    <!-- Header escuro -->
    <tr><td style="background:#111827;border-radius:16px 16px 0 0;padding:36px 36px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;"><tr>
        <td style="vertical-align:middle;padding-right:8px;">
          <img src="https://destaka.com.br/email-pin.png" alt="" width="22" height="26" style="display:block;border:0;" />
        </td>
        <td style="vertical-align:middle;">
          <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.015em;line-height:1;">Destaka</span>
          <span style="font-size:18px;font-weight:300;color:rgba(255,255,255,0.5);letter-spacing:-0.015em;line-height:1;margin-left:4px;">Saúde</span>
        </td>
      </tr></table>
      <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 6px;line-height:1.2;">
        ${heroHeadline(data)}
      </h1>
      <p style="color:#9ca3af;font-size:14px;margin:0;">${escapeHtml(data.organization_name)} &bull; ${data.month_label} ${data.year}</p>
    </td></tr>

    <!-- Tempo como cliente -->
    <tr><td style="background:#ffffff;padding:36px 36px 28px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 8px;">Seu histórico com o Destaka Saúde</p>
      <p style="font-size:48px;font-weight:900;color:#111827;line-height:1;margin:0;">${data.days_as_customer} <span style="font-size:20px;font-weight:400;color:#6b7280;">dias</span></p>
      <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:12px 0 0;">${daysAsCustomerCopy(data.days_as_customer)}</p>
    </td></tr>

    <!-- Divisor -->
    <tr><td style="background:#ffffff;padding:0 36px;"><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;"></td></tr>

    <!-- Evolução desde o início -->
    <tr><td style="background:#ffffff;padding:28px 36px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">Evolução desde o início</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="background:#f9fafb;border-radius:10px;padding:20px;width:45%;">
            <p style="margin:0;font-size:12px;color:#4b5563;font-weight:600;">Quando você chegou</p>
            <p style="margin:4px 0 0;font-size:36px;font-weight:800;color:#6b7280;line-height:1;">${data.score_initial ?? data.score_previous}</p>
          </td>
          <td style="width:10%;text-align:center;">
            <p style="margin:0;font-size:20px;color:#0f766e;font-weight:700;">→</p>
          </td>
          <td align="center" style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:20px;width:45%;">
            <p style="margin:0;font-size:12px;color:#134e4a;font-weight:600;">Hoje</p>
            <p style="margin:4px 0 0;font-size:36px;font-weight:800;color:#0f766e;line-height:1;">${data.score_current}</p>
            ${totalDelta > 0 ? `<p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#115e59;">+${totalDelta} pontos desde o dia 1</p>` : ''}
          </td>
        </tr>
      </table>
      ${totalDelta > 20
        ? `<p style="font-size:15px;color:#4b5563;line-height:1.6;margin:16px 0 0;">Essa evolução não é sorte. É o resultado de ${data.days_as_customer} dias de trabalho contínuo no seu perfil.</p>`
        : totalDelta > 0
          ? `<p style="font-size:15px;color:#4b5563;line-height:1.6;margin:16px 0 0;">Crescimento real. Cada ponto a mais significa que o Google está mostrando você para mais pacientes.</p>`
          : totalDelta === 0
            ? `<p style="font-size:15px;color:#4b5563;line-height:1.6;margin:16px 0 0;">O score se manteve. Vamos identificar onde destravar o próximo salto.</p>`
            : `<p style="font-size:15px;color:#4b5563;line-height:1.6;margin:16px 0 0;">Seu score caiu em relação ao início. Isso acontece quando fatores externos mudam. Já estamos corrigindo.</p>`}
    </td></tr>

    <!-- Divisor -->
    <tr><td style="background:#ffffff;padding:0 36px;"><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;"></td></tr>

    <!-- Score do mês -->
    <tr><td style="background:#ffffff;padding:28px 36px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 4px;">Score Destaka Saúde</p>
      <span style="font-size:72px;font-weight:900;color:${color};line-height:1;letter-spacing:-2px;vertical-align:baseline;">${data.score_current}</span>
      <span style="font-size:24px;font-weight:400;color:#9ca3af;margin-left:4px;vertical-align:baseline;">/100</span>
      <br>
      <span style="display:inline-block;background:${color}15;color:${badgeTextColor};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;margin-top:8px;">${faixaLabel}</span>
      <p style="font-size:14px;color:#6b7280;margin:10px 0 0;">${scoreDeltaCopy(data)}</p>

      <div style="background:#e5e7eb;border-radius:8px;height:14px;margin:20px 0 6px;">
        <div style="background:${color};width:${data.score_current}%;height:14px;border-radius:8px;"></div>
      </div>
      <p style="font-size:12px;color:#6b7280;margin:0 0 24px;">
        ${data.score_current >= 70
          ? 'Você está no grupo dos perfis mais bem posicionados da sua região.'
          : data.score_current >= 40
            ? `Faltam ${70 - data.score_current} pontos para entrar no grupo Presença Forte.`
            : `Com foco nos próximos 30 dias, o salto para Presença Funcional é viável.`}
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f3f4f6;padding-top:20px;">
        <tr>
          <td style="padding:0 10px 0 0;vertical-align:top;width:50%;">
            <p style="font-size:12px;color:#4b5563;font-weight:600;margin:0;">Perfil no Google</p>
            ${scoreBar(data.score_components.gmb_completude, 25, color)}
          </td>
          <td style="padding:0 0 0 10px;vertical-align:top;width:50%;">
            <p style="font-size:12px;color:#4b5563;font-weight:600;margin:0;">Reputação</p>
            ${scoreBar(data.score_components.reputacao, 25, color)}
          </td>
        </tr>
        <tr><td colspan="2" style="height:16px;"></td></tr>
        <tr>
          <td style="padding:0 10px 0 0;vertical-align:top;width:50%;">
            <p style="font-size:12px;color:#4b5563;font-weight:600;margin:0;">Visibilidade</p>
            ${scoreBar(data.score_components.visibilidade, 20, color)}
          </td>
          <td style="padding:0 0 0 10px;vertical-align:top;width:50%;">
            <p style="font-size:12px;color:#4b5563;font-weight:600;margin:0;">Retenção</p>
            ${scoreBar(data.score_components.retencao, 20, color)}
          </td>
        </tr>
        <tr><td colspan="2" style="height:16px;"></td></tr>
        <tr>
          <td style="padding:0 10px 0 0;vertical-align:top;width:50%;">
            <p style="font-size:12px;color:#4b5563;font-weight:600;margin:0;">Conversão</p>
            ${scoreBar(data.score_components.conversao, 10, color)}
          </td>
          <td></td>
        </tr>
      </table>
    </td></tr>

    <!-- Divisor -->
    <tr><td style="background:#ffffff;padding:0 36px;"><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;"></td></tr>

    <!-- EPIC-009: Avaliacoes do mes (Review Intelligence) -->
    ${data.review_analysis && data.review_analysis.totalReviews > 0 ? `
    <tr><td style="background:#ffffff;padding:28px 36px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 8px;">Avaliações do mês</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;width:48%;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${data.review_analysis.totalReviews}</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">novas avaliações</p>
          </td>
          <td style="width:4%;"></td>
          <td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;width:48%;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${data.review_analysis.averageRating.toFixed(1)}<span style="font-size:18px;color:#6b7280;">★</span></p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">média do mês</p>
          </td>
        </tr>
      </table>

      ${data.review_analysis.topPraises.length > 0 ? `
      <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 8px;">
        <strong>Seus pacientes mais elogiam:</strong>
      </p>
      <p style="font-size:15px;color:#111827;line-height:1.6;margin:0 0 16px;">
        ${data.review_analysis.topPraises.map(p => `"${escapeHtml(p.theme)}" (${p.count}x)`).join(', ')}
      </p>` : ''}

      ${data.review_analysis.concerns && data.review_analysis.concerns.length > 0 ? `
      <p style="font-size:14px;color:#92400e;line-height:1.6;margin:0;background:#fffbeb;border-radius:8px;padding:12px 16px;">
        <strong>Ponto de atenção:</strong>
        ${data.review_analysis.concerns.map(c => `${c.count} ${c.count === 1 ? 'menção' : 'menções'} a "${escapeHtml(c.theme)}" em avaliações 1-3★`).join('. ')}.
      </p>` : ''}
    </td></tr>

    <tr><td style="background:#ffffff;padding:0 36px;"><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;"></td></tr>` : ''}

    <!-- Pacientes que encontraram você -->
    ${(data.profile_views ?? 0) > 0 || (data.website_clicks ?? 0) > 0 || (data.phone_clicks ?? 0) > 0 || (data.whatsapp_clicks ?? 0) > 0 ? `
    <tr><td style="background:#ffffff;padding:28px 36px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 8px;">Pacientes que encontraram você</p>
      <p style="color:#111827;font-size:16px;font-weight:700;margin:0 0 16px;">Quem pesquisou, encontrou o seu nome.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          ${(data.profile_views ?? 0) > 0 ? `<td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;width:48%;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${(data.profile_views ?? 0).toLocaleString('pt-BR')}</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">viram seu perfil</p>
          </td><td style="width:4%;"></td>` : ''}
          ${(data.website_clicks ?? 0) > 0 ? `<td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;width:48%;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${data.website_clicks}</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">visitaram o site</p>
          </td>` : ''}
        </tr>
        ${(data.phone_clicks ?? 0) > 0 || (data.whatsapp_clicks ?? 0) > 0 ? `<tr><td colspan="3" style="height:8px;"></td></tr>
        <tr>
          ${(data.phone_clicks ?? 0) > 0 ? `<td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;width:48%;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${data.phone_clicks}</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">ligaram</p>
          </td><td style="width:4%;"></td>` : ''}
          ${(data.whatsapp_clicks ?? 0) > 0 ? `<td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;width:48%;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${data.whatsapp_clicks}</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">WhatsApp</p>
          </td>` : ''}
        </tr>` : ''}
      </table>

      ${engInsight ? `<p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0;">${engInsight}</p>` : ''}
    </td></tr>

    <tr><td style="background:#ffffff;padding:0 36px;"><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;"></td></tr>` : ''}

    <!-- O que o Destaka Saúde fez -->
    <tr><td style="background:#ffffff;padding:28px 36px;">
      <p style="color:#111827;font-size:16px;font-weight:700;margin:0 0 12px;">Enquanto você atendia pacientes</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#f9fafb;border-radius:10px;padding:16px;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${data.posts_published_this_month}</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">posts publicados no seu nome</p>
          </td>
        </tr>
      </table>
      <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:16px 0 0;">${postsInsight(data)}</p>
    </td></tr>

    <!-- Divisor -->
    <tr><td style="background:#ffffff;padding:0 36px;"><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;"></td></tr>

    <!-- Reputação -->
    <tr><td style="background:#ffffff;padding:28px 36px;">
      <p style="color:#111827;font-size:16px;font-weight:700;margin:0 0 16px;">O que os pacientes disseram</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;width:48%;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${data.avg_rating.toFixed(1)}</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">nota média</p>
          </td>
          <td style="width:4%;"></td>
          <td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;width:48%;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${data.reviews_new_this_month}</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">avaliações novas</p>
          </td>
        </tr>
        <tr><td colspan="3" style="height:8px;"></td></tr>
        <tr>
          <td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;width:48%;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${responseRatePct}%</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">respondidas</p>
          </td>
          <td style="width:4%;"></td>
          <td></td>
        </tr>
      </table>

      <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0;">${reputationInsight(data)}</p>
    </td></tr>

    <!-- Foco do próximo mês -->
    <tr><td style="background:#111827;padding:28px 36px;">
      <p style="color:#9ca3af;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">Uma coisa para ${data.month_label === 'Dezembro' ? 'Janeiro' : 'o próximo mês'}</p>
      <p style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 8px;">${escapeHtml(data.next_month_focus)}</p>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0;">${escapeHtml(data.next_month_action)}</p>
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
      <p style="font-size:13px;color:#4b5563;margin:0 0 8px;font-weight:500;">
        Você cuida dos seus pacientes. O Destaka Saúde cuida de trazer os próximos.
      </p>
      <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">
        Dúvidas? <a href="mailto:${SUPPORT_EMAIL}" style="color:#0f766e;font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
      </p>
      <p style="font-size:11px;color:#6b7280;margin:0;">
        Destaka Saúde &bull; ${escapeHtml(data.organization_name)}
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`

  return { subject, html }
}
