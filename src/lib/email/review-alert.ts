import { resend, FROM } from './index'
import { escapeHtml } from '@/lib/utils/escape-html'
import { getVocab, getBrandName } from '@/lib/vertical-vocab'

interface NegativeReviewAlertParams {
  to: string
  orgName: string
  reviewAuthor: string
  reviewRating: number
  reviewText: string | null
  dashboardUrl: string
  specialty?: string | null
}

export async function sendNegativeReviewAlert(params: NegativeReviewAlertParams) {
  const { to, orgName, reviewAuthor, reviewRating, reviewText, dashboardUrl, specialty } = params
  const vocab = getVocab(specialty)
  const brandSuffix = vocab.brandLabel ? `<span style="font-size:18px;font-weight:300;color:rgba(255,255,255,0.5);letter-spacing:-0.015em;line-height:1;margin-left:4px;">${vocab.brandLabel}</span>` : ''
  const stars = '\u2605'.repeat(reviewRating) + '\u2606'.repeat(5 - reviewRating)
  const safeAuthor = (reviewAuthor ?? '').replace(/[\r\n\t]/g, ' ').slice(0, 100)

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
              ${brandSuffix}
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:36px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px;line-height:1.3;">
            Avalia\u00e7\u00e3o ${reviewRating}\u2605 no perfil de ${escapeHtml(orgName)}. Precisa da sua aten\u00e7\u00e3o.
          </h1>

          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin:0 0 24px;">
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">${escapeHtml(safeAuthor)}</p>
            <p style="font-size:18px;color:#F59E0B;margin:0 0 8px;letter-spacing:2px;">${stars}</p>
            <p style="font-size:14px;color:#4b5563;line-height:1.5;margin:0;font-style:italic;">"${escapeHtml(reviewText || 'Sem texto')}"</p>
          </div>

          <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 24px;">
            Responder pessoalmente a avalia\u00e7\u00f5es negativas \u00e9 fundamental. ${vocab.clientes.charAt(0).toUpperCase() + vocab.clientes.slice(1)} que veem uma resposta cuidadosa do profissional confiam mais do que se o review negativo n\u00e3o existisse.
          </p>

          <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-top:8px;">
            Responder agora
          </a>
        </td></tr>
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
          <p style="font-size:13px;color:#4b5563;margin:0 0 4px;font-weight:500;">${vocab.emailFooter}</p>
          <p style="font-size:11px;color:#9ca3af;margin:0;">D\u00favidas? <a href="mailto:suporte@destaka.com.br" style="color:#0f766e;text-decoration:none;">suporte@destaka.com.br</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Avaliacao ${reviewRating}\u2605 no seu perfil. Precisa da sua atencao.`,
    html,
  })
}
