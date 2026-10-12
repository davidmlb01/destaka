import { resend, FROM } from './index'
import { escapeHtml } from '@/lib/utils/escape-html'

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'
  const dashboardUrl = `${appUrl}/dashboard/reviews`

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
              <span style="font-size:18px;font-weight:300;color:rgba(255,255,255,0.5);letter-spacing:-0.015em;line-height:1;margin-left:4px;">Saúde</span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:36px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px;line-height:1.3;">
            Um paciente deixou uma avaliação. Sua resposta conquista o próximo.
          </h1>
          <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 24px;">
            <strong>${escapeHtml(businessName)}</strong> recebeu uma avaliação. Cada resposta é um sinal de confiança para quem está escolhendo um profissional agora.
          </p>

          <div style="background:#f9fafb;border-radius:10px;padding:20px;margin:0 0 24px;">
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">${escapeHtml(reviewAuthor)}</p>
            <p style="font-size:18px;color:#F59E0B;margin:0 0 8px;letter-spacing:2px;">${stars}</p>
            <p style="font-size:14px;color:#4b5563;line-height:1.5;margin:0;font-style:italic;">"${escapeHtml(reviewText || 'Sem texto')}"</p>
          </div>

          <p style="font-size:13px;color:#6b7280;margin:0 0 8px;font-weight:600;">Resposta sugerida pelo Destaka Saúde:</p>
          <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:20px;margin:0 0 24px;">
            <p style="font-size:14px;color:#134e4a;line-height:1.6;margin:0;">${escapeHtml(suggestedReply)}</p>
          </div>

          <a href="${dashboardUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-top:8px;">
            Aprovar e fortalecer sua reputação
          </a>

          <p style="font-size:13px;color:#9ca3af;margin:16px 0 0;line-height:1.5;">
            Avaliações respondidas rapidamente geram mais confiança. Se não aprovar em 7 dias, a resposta não será publicada.
          </p>
        </td></tr>
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
          <p style="font-size:13px;color:#4b5563;margin:0 0 4px;font-weight:500;">Você cuida dos seus pacientes. O Destaka Saúde cuida de trazer os próximos.</p>
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
    subject: `${reviewRating}★ de ${(reviewAuthor ?? '').replace(/[\r\n\t]/g, ' ').slice(0, 100)}. Responda e conquiste o proximo paciente`,
    html,
  })
}
