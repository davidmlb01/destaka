import { resend, FROM } from './index'
import { escapeHtml } from '@/lib/utils/escape-html'

interface CompetitorAlertParams {
  to: string
  orgName: string
  competitorName: string
  competitorReviews: number
  competitorGain: number
  userReviews: number
  userGain: number
  dashboardUrl: string
}

export async function sendCompetitorAlert(params: CompetitorAlertParams) {
  const {
    to, orgName, competitorName, competitorReviews,
    competitorGain, userReviews, userGain, dashboardUrl,
  } = params

  const diff = competitorReviews - userReviews
  const aheadText = diff > 0
    ? `Está ${diff} avaliações à frente de você.`
    : `Você ainda está ${Math.abs(diff)} avaliações à frente.`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr><td style="background:#111827;border-radius:16px 16px 0 0;padding:28px 36px;">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;padding-right:8px;">
              <img src="https://destaka.com.br/email-pin.png" alt="" width="22" height="26" style="display:block;border:0;" />
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.015em;line-height:1;">Destaka</span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:36px;">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.3px;line-height:1.3;">
            ${escapeHtml(competitorName)} ganhou ${competitorGain} avaliações esta semana
          </h1>

          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:20px;margin:0 0 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;padding:8px;">
                  <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">Concorrente</p>
                  <p style="font-size:22px;font-weight:800;color:#111827;margin:0;">${competitorReviews}</p>
                  <p style="font-size:13px;color:#d97706;margin:4px 0 0;font-weight:600;">+${competitorGain} esta semana</p>
                </td>
                <td style="width:50%;padding:8px;border-left:1px solid #fde68a;">
                  <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">${escapeHtml(orgName)}</p>
                  <p style="font-size:22px;font-weight:800;color:#111827;margin:0;">${userReviews}</p>
                  <p style="font-size:13px;color:${userGain > 0 ? '#059669' : '#6b7280'};margin:4px 0 0;font-weight:600;">+${userGain} esta semana</p>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 8px;">
            ${aheadText}
          </p>
          <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 24px;">
            Peça a 5 pacientes esta semana para avaliarem sua consulta no Google. Cada avaliação conta.
          </p>

          <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
            Ver painel completo
          </a>
        </td></tr>
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
          <p style="font-size:13px;color:#4b5563;margin:0 0 4px;font-weight:500;">Destaka cuida do seu perfil no Google</p>
          <p style="font-size:11px;color:#9ca3af;margin:0;">Dúvidas? <a href="mailto:suporte@destaka.com.br" style="color:#0f766e;text-decoration:none;">suporte@destaka.com.br</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${competitorName} ganhou ${competitorGain} avaliações esta semana`,
    html,
  })
}
