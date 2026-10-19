import { resend, FROM } from './index'
import type { CategoryScore } from '@/lib/gmb/scorer'
import { getScoreColor, getScoreLabel } from '@/lib/utils/score-colors'
import { escapeHtml } from '@/lib/utils/escape-html'
import { getVocab, getBrandName } from '@/lib/vertical-vocab'

interface LeadMagnetEmailParams {
  to: string
  placeName: string
  score: number
  categories: CategoryScore[]
  specialty?: string | null
}

function scoreColor(score: number): string {
  return getScoreColor(score)
}

function scoreLabel(score: number): string {
  return getScoreLabel(score)
}

export async function sendLeadMagnetEmail(params: LeadMagnetEmailParams) {
  const { to, placeName, score, categories, specialty } = params
  const vocab = getVocab(specialty)
  const brand = getBrandName(specialty)
  const brandSuffix = vocab.brandLabel ? `<span style="font-size:18px;font-weight:300;color:rgba(255,255,255,0.5);letter-spacing:-0.015em;line-height:1;margin-left:4px;">${vocab.brandLabel}</span>` : ''
  const color = scoreColor(score)
  const label = scoreLabel(score)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

  // Top 3 gaps mais criticos
  const topGaps = categories
    .flatMap(c => c.issues)
    .filter(i => i.severity === 'critical' || i.severity === 'warning')
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)

  const gapsHtml = topGaps.map(gap => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${escapeHtml(gap.message)}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Impacto: +${gap.impact} pts se corrigido</p>
      </td>
    </tr>`).join('')

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

        <!-- Header -->
        <tr><td style="background:#111827;border-radius:16px 16px 0 0;padding:28px 36px;">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;padding-right:8px;">
              <img src="https://destaka.com.br/email-pin.png" alt="" width="22" height="26" style="display:block;border:0;" />
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.015em;line-height:1;">Destaka</span>
              ${brandSuffix}
            </td>
          </tr></table>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:13px;">Auditoria gratuita do seu perfil</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px;">

          <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px;">
            Quantos ${vocab.clientes} ${escapeHtml(placeName)} está perdendo?
          </h1>
          <p style="margin:0 0 28px;font-size:15px;color:#6b7280;">Veja o que encontramos na sua auditoria.</p>

          <!-- Score -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;border-radius:10px;margin-bottom:28px;">
            <tr><td style="padding:24px;text-align:center;">
              <p style="margin:0;font-size:60px;font-weight:800;color:${color};line-height:1;">${score}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">de 100 pontos</p>
              <p style="margin:10px 0 0;font-size:14px;font-weight:700;color:${color};">${label}</p>
            </td></tr>
          </table>

          <!-- Gaps -->
          ${topGaps.length > 0 ? `
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;">
            Por que ${vocab.clientes} não estão te encontrando
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            ${gapsHtml}
          </table>` : ''}

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid rgba(15,17,23,0.12);border-radius:10px;margin-bottom:8px;">
            <tr><td style="padding:24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:#111827;">
                Cada problema acima é um ${vocab.cliente} que escolheu outro profissional.
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.5;">
                O ${brand} corrige tudo automaticamente. Conecte seu perfil e comece a aparecer para quem está procurando você agora.
              </p>
              <a href="${appUrl}/login"
                 style="display:inline-block;background:#0f766e;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                Quero atrair mais ${vocab.clientes}
              </a>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
          <p style="font-size:13px;color:#4b5563;margin:0 0 4px;font-weight:500;">${vocab.emailFooter}</p>
          <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;">Dúvidas? <a href="mailto:suporte@destaka.com.br" style="color:#0f766e;text-decoration:none;">suporte@destaka.com.br</a></p>
          <p style="font-size:11px;color:#9ca3af;margin:0;">Você recebeu este email porque solicitou uma auditoria gratuita.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${(placeName ?? '').replace(/[\r\n\t]/g, ' ').slice(0, 100)}: ${score}/100. Veja quantos ${vocab.clientes} voce esta perdendo`,
    html,
  })
}
