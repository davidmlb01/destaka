import { resend, FROM } from './index'
import { escapeHtml } from '@/lib/utils/escape-html'

interface ProfileChangeAlertParams {
  to: string
  orgName: string
  changes: { field: string; before: string; after: string }[]
  dashboardUrl: string
}

export async function sendProfileChangeAlert(params: ProfileChangeAlertParams) {
  const { to, orgName, changes, dashboardUrl } = params

  const changesHtml = changes.map(c => `
    <tr>
      <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${escapeHtml(c.field)}</td>
      <td style="padding:8px 12px;font-size:13px;color:#991B1B;border-bottom:1px solid #f3f4f6;text-decoration:line-through;">${escapeHtml(c.before.slice(0, 120))}</td>
      <td style="padding:8px 12px;font-size:13px;color:#065F46;border-bottom:1px solid #f3f4f6;">${escapeHtml(c.after.slice(0, 120))}</td>
    </tr>
  `).join('')

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
            Mudanças detectadas no perfil de ${escapeHtml(orgName)}
          </h1>

          <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 20px;">
            O Google permite que qualquer pessoa sugira edições no seu perfil. Detectamos ${changes.length === 1 ? 'uma alteração' : `${changes.length} alterações`} que não foram feitas pelo Destaka:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 24px;">
            <tr style="background:#f9fafb;">
              <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;color:#6b7280;text-align:left;">Campo</th>
              <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;color:#6b7280;text-align:left;">Antes</th>
              <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;color:#6b7280;text-align:left;">Agora</th>
            </tr>
            ${changesHtml}
          </table>

          <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 24px;">
            Se essas mudanças não foram autorizadas por você, acesse o Google Meu Negócio para corrigir. O Destaka continuará monitorando.
          </p>

          <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
            Ver meu painel
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
    subject: `Mudanças detectadas no perfil de ${orgName}`,
    html,
  })
}
