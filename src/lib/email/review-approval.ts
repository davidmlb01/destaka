import { resend, FROM } from './index'

interface ReviewApprovalParams {
  to: string
  businessName: string
  reviewAuthor: string
  reviewRating: number
  reviewText: string | null
  suggestedReply: string
}

export async function sendReviewApprovalEmail(params: ReviewApprovalParams) {
  const { to, businessName, reviewAuthor, reviewRating, reviewText, suggestedReply } = params
  const stars = '★'.repeat(reviewRating) + '☆'.repeat(5 - reviewRating)
  const dashboardUrl = 'https://destaka.com.br/saude/dashboard/reviews'

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#091e2f;padding:24px 32px;">
          <span style="font-family:Outfit,Arial,sans-serif;font-weight:700;font-size:18px;color:#ffffff;letter-spacing:0.5px;">Destaka</span>
          <span style="font-family:Outfit,Arial,sans-serif;font-weight:300;font-size:18px;color:rgba(255,255,255,0.4);letter-spacing:0.5px;margin-left:4px;">Saúde</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:16px;color:#1C1917;margin:0 0 16px;">Olá!</p>
          <p style="font-size:15px;color:#57534E;line-height:1.6;margin:0 0 24px;">
            <strong>${businessName}</strong> recebeu uma avaliação que precisa da sua aprovação antes de responder.
          </p>

          <div style="background:#f5f5f4;border-radius:8px;padding:20px;margin:0 0 24px;">
            <p style="font-size:13px;color:#78716C;margin:0 0 4px;">${reviewAuthor}</p>
            <p style="font-size:18px;color:#F59E0B;margin:0 0 8px;letter-spacing:2px;">${stars}</p>
            <p style="font-size:14px;color:#44403C;line-height:1.5;margin:0;font-style:italic;">"${reviewText || 'Sem texto'}"</p>
          </div>

          <p style="font-size:13px;color:#78716C;margin:0 0 8px;font-weight:600;">Resposta sugerida pela Destaka:</p>
          <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:16px;margin:0 0 24px;">
            <p style="font-size:14px;color:#1E40AF;line-height:1.5;margin:0;">${suggestedReply}</p>
          </div>

          <a href="${dashboardUrl}" style="display:inline-block;background:#0EA5E9;color:#ffffff;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;text-decoration:none;">
            Revisar e aprovar
          </a>

          <p style="font-size:12px;color:#A8A29E;margin:16px 0 0;line-height:1.5;">
            Se você não aprovar em 7 dias, a resposta não será publicada.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #E7E5E4;">
          <p style="font-size:11px;color:#A8A29E;margin:0;">Destaka Saúde. Quem te procura, te encontra.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Avaliação ${reviewRating} estrela${reviewRating !== 1 ? 's' : ''}: aprovação necessária`,
    html,
  })
}
