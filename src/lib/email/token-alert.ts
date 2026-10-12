import { resend, FROM } from './index'
import { escapeHtml } from '@/lib/utils/escape-html'

interface TokenDisconnectedParams {
  to: string
  orgName: string
  dashboardUrl: string
}

export async function sendTokenDisconnectedAlert(params: TokenDisconnectedParams) {
  const { to, orgName, dashboardUrl } = params

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
              <span style="font-size:18px;font-weight:300;color:rgba(255,255,255,0.5);letter-spacing:-0.015em;line-height:1;margin-left:4px;">Sa\u00fade</span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:36px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px;line-height:1.3;">
            Sua conta Google foi desconectada. O Destaka precisa de reconex\u00e3o.
          </h1>

          <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 24px;">
            O Destaka n\u00e3o est\u00e1 conseguindo acessar o perfil de <strong>${escapeHtml(orgName)}</strong> no Google. Isso significa que avalia\u00e7\u00f5es, posts e otimiza\u00e7\u00f5es est\u00e3o pausados.
          </p>

          <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 24px;">
            Para retomar o funcionamento completo, basta reconectar a conta Google no painel.
          </p>

          <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-top:8px;">
            Reconectar conta Google
          </a>
        </td></tr>
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
          <p style="font-size:13px;color:#4b5563;margin:0 0 4px;font-weight:500;">Voc\u00ea cuida dos seus pacientes. O Destaka Sa\u00fade cuida de trazer os pr\u00f3ximos.</p>
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
    subject: 'Sua conta Google foi desconectada. O Destaka precisa de reconexao.',
    html,
  })
}
