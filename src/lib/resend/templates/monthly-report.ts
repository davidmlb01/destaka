// Template HTML do relatório mensal — copy orientado a progresso e emoção
import type { MonthlyReportData } from '@/lib/report/report-compiler'

const FAIXA_COLOR: Record<string, string> = {
  fraca: '#ef4444',
  funcional: '#f59e0b',
  forte: '#22c55e',
  perfeita: '#3b82f6',
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
    <p style="font-size:11px;color:#9ca3af;margin:3px 0 0;">${value} de ${max} pts</p>
  `
}

function subjectLine(data: MonthlyReportData): string {
  const firstName = data.professional_name.split(' ')[0]

  if (data.score_delta > 5) {
    return `${firstName}, você subiu ${data.score_delta} pontos em ${data.month_label}. Veja o que aconteceu.`
  }
  if (data.score_delta > 0) {
    return `${firstName}, seu Score Destaka cresceu em ${data.month_label}. Aqui está o resumo.`
  }
  if (data.score_delta < 0) {
    return `${firstName}, o que aconteceu no seu Google em ${data.month_label}. Temos um plano.`
  }
  return `${firstName}, seu ${data.month_label} no Google. ${data.reviews_new_this_month > 0 ? `${data.reviews_new_this_month} pacientes avaliaram você.` : 'Veja o resumo completo.'}`
}

function heroHeadline(data: MonthlyReportData): string {
  const firstName = data.professional_name.split(' ')[0]

  if (data.score_delta > 5) return `${firstName}, você cresceu este mês.`
  if (data.score_delta > 0) return `${firstName}, movimento positivo em ${data.month_label}.`
  if (data.score_delta < 0) return `${firstName}, aqui está o que precisamos ajustar.`
  return `${firstName}, seu mês de ${data.month_label}.`
}

function scoreDeltaCopy(data: MonthlyReportData): string {
  if (data.score_delta > 5) return `Você subiu <strong>${data.score_delta} pontos</strong> este mês. Continue assim.`
  if (data.score_delta > 0) return `Alta de <strong>${data.score_delta} pontos</strong> em relação ao mês passado.`
  if (data.score_delta < 0) return `Queda de <strong>${Math.abs(data.score_delta)} pontos</strong>. Já sabemos o que corrigir.`
  return `Estável em relação ao mês anterior.`
}

function reputationInsight(data: MonthlyReportData): string {
  const rate = Math.round(data.response_rate * 100)
  const lines: string[] = []

  if (data.reviews_new_this_month === 0) {
    lines.push('Nenhuma avaliação nova este mês. Pedir reviews ativamente pode mudar esse número rapidamente.')
  } else if (data.reviews_new_this_month === 1) {
    lines.push('1 paciente te avaliou este mês. Cada review conta para o Google te mostrar mais.')
  } else {
    lines.push(`${data.reviews_new_this_month} pacientes te avaliaram. Isso alimenta diretamente sua posição no Maps.`)
  }

  if (rate >= 80) {
    lines.push(`Você respondeu ${rate}% dos reviews. Pacientes percebem esse cuidado.`)
  } else if (rate >= 50) {
    lines.push(`${rate}% de taxa de resposta. Responder a todos aumenta sua nota de relevância no Google.`)
  } else if (rate > 0) {
    lines.push(`Só ${rate}% dos reviews foram respondidos. Cada resposta é sinal de atividade para o algoritmo.`)
  }

  return lines.join(' ')
}

function postsInsight(data: MonthlyReportData): string {
  if (data.posts_published_this_month === 0) {
    return 'Nenhum post foi publicado este mês. Posts regulares mantêm seu perfil ativo para o Google.'
  }
  if (data.posts_published_this_month <= 2) {
    return `${data.posts_published_this_month} post${data.posts_published_this_month > 1 ? 's publicados' : ' publicado'} no seu nome. Ideal é manter pelo menos 2 por semana.`
  }
  return `${data.posts_published_this_month} posts publicados no seu nome. Seu perfil ficou ativo para o Google durante o mês inteiro.`
}

export function buildMonthlyReportEmail(data: MonthlyReportData): { subject: string; html: string } {
  const color = FAIXA_COLOR[data.score_faixa] ?? '#6b7280'
  const faixaLabel = FAIXA_LABEL[data.score_faixa] ?? 'Presença'
  const responseRatePct = Math.round(data.response_rate * 100)

  const subject = subjectLine(data)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Destaka ${data.month_label} ${data.year}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
  <tr><td align="center">
  <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

    <!-- Header escuro -->
    <tr><td style="background:#111827;border-radius:16px 16px 0 0;padding:36px 36px 28px;">
      <p style="color:#6b7280;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">Destaka</p>
      <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 6px;line-height:1.2;">
        ${heroHeadline(data)}
      </h1>
      <p style="color:#9ca3af;font-size:14px;margin:0;">${data.organization_name} &bull; ${data.month_label} ${data.year}</p>
    </td></tr>

    <!-- Score hero -->
    <tr><td style="background:#ffffff;padding:36px 36px 28px;">

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 4px;">Score Destaka</p>
            <div style="display:inline-flex;align-items:baseline;">
              <span style="font-size:72px;font-weight:900;color:${color};line-height:1;letter-spacing:-2px;">${data.score_current}</span>
              <span style="font-size:24px;font-weight:400;color:#d1d5db;margin-left:4px;">/100</span>
            </div>
            <br>
            <span style="display:inline-block;background:${color}20;color:${color};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;margin-top:8px;">${faixaLabel}</span>
            <p style="font-size:13px;color:#6b7280;margin:10px 0 0;">${scoreDeltaCopy(data)}</p>
          </td>
        </tr>
      </table>

      <!-- Barra principal -->
      <div style="background:#e5e7eb;border-radius:8px;height:14px;margin:20px 0 6px;">
        <div style="background:${color};width:${data.score_current}%;height:14px;border-radius:8px;transition:width 0.3s;"></div>
      </div>
      <p style="font-size:12px;color:#9ca3af;margin:0 0 24px;">
        ${data.score_current >= 70
          ? 'Você está no grupo dos perfis mais bem posicionados.'
          : data.score_current >= 40
            ? `Faltam ${70 - data.score_current} pontos para entrar no grupo Presença Forte.`
            : `Com foco nos próximos 30 dias é possível subir para Presença Funcional.`}
      </p>

      <!-- Componentes -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f3f4f6;padding-top:20px;">
        <tr>
          <td style="padding:0 10px 0 0;vertical-align:top;width:50%;">
            <p style="font-size:12px;color:#374151;font-weight:600;margin:0;">Perfil no Google</p>
            ${scoreBar(data.score_components.gmb_completude, 25, color)}
          </td>
          <td style="padding:0 0 0 10px;vertical-align:top;width:50%;">
            <p style="font-size:12px;color:#374151;font-weight:600;margin:0;">Reputação</p>
            ${scoreBar(data.score_components.reputacao, 25, color)}
          </td>
        </tr>
        <tr><td colspan="2" style="height:16px;"></td></tr>
        <tr>
          <td style="padding:0 10px 0 0;vertical-align:top;width:50%;">
            <p style="font-size:12px;color:#374151;font-weight:600;margin:0;">Visibilidade</p>
            ${scoreBar(data.score_components.visibilidade, 20, color)}
          </td>
          <td style="padding:0 0 0 10px;vertical-align:top;width:50%;">
            <p style="font-size:12px;color:#374151;font-weight:600;margin:0;">Retenção</p>
            ${scoreBar(data.score_components.retencao, 20, color)}
          </td>
        </tr>
        <tr><td colspan="2" style="height:16px;"></td></tr>
        <tr>
          <td style="padding:0 10px 0 0;vertical-align:top;width:50%;">
            <p style="font-size:12px;color:#374151;font-weight:600;margin:0;">Conversão</p>
            ${scoreBar(data.score_components.conversao, 10, color)}
          </td>
          <td></td>
        </tr>
      </table>
    </td></tr>

    <!-- Divisor -->
    <tr><td style="background:#ffffff;padding:0 36px;"><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;"></td></tr>

    <!-- Reputação com narrativa -->
    <tr><td style="background:#ffffff;padding:28px 36px;">
      <p style="color:#111827;font-size:16px;font-weight:700;margin:0 0 16px;">O que os pacientes disseram</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${data.avg_rating.toFixed(1)}</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">nota média</p>
          </td>
          <td style="width:12px;"></td>
          <td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${data.reviews_new_this_month}</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">avaliações novas</p>
          </td>
          <td style="width:12px;"></td>
          <td align="center" style="background:#f9fafb;border-radius:10px;padding:16px 8px;">
            <p style="font-size:36px;font-weight:800;color:#111827;margin:0;line-height:1;">${responseRatePct}%</p>
            <p style="font-size:11px;color:#6b7280;font-weight:600;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;">respondidas</p>
          </td>
        </tr>
      </table>

      <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0;">${reputationInsight(data)}</p>
    </td></tr>

    <!-- Divisor -->
    <tr><td style="background:#ffffff;padding:0 36px;"><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;"></td></tr>

    <!-- Conteúdo com narrativa -->
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
      <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:16px 0 0;">${postsInsight(data)}</p>
    </td></tr>

    <!-- Foco do próximo mês -->
    <tr><td style="background:#111827;padding:28px 36px;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">Uma coisa para ${data.month_label === 'Dezembro' ? 'Janeiro' : 'o próximo mês'}</p>
      <p style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 8px;">${data.next_month_focus}</p>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0;">${data.next_month_action}</p>
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
      <p style="font-size:13px;color:#6b7280;margin:0 0 4px;font-weight:500;">
        Você cuida dos seus pacientes. O Destaka cuida do seu Google.
      </p>
      <p style="font-size:11px;color:#9ca3af;margin:0;">
        Destaka &bull; ${data.organization_name}
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`

  return { subject, html }
}
