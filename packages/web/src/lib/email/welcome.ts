import { resend, FROM } from './index'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

const BASE_STYLES = {
  body: 'margin:0;padding:0;background:#f5f5f4;font-family:Inter,Arial,sans-serif;',
  outer: 'background:#f5f5f4;padding:32px 0;',
  card: 'background:#ffffff;border-radius:16px;overflow:hidden;',
  header: 'background:linear-gradient(135deg,#161B26,#0F1117);padding:32px 40px;text-align:center;',
  body_cell: 'padding:40px;',
  footer: 'padding:24px 40px;border-top:1px solid #e7e5e4;text-align:center;',
  cta: 'display:inline-block;background:#0284C7;color:#1C1917;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;',
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
        </td></tr>
        <tr><td style="${BASE_STYLES.body_cell}">${content}</td></tr>
        <tr><td style="${BASE_STYLES.footer}">
          <p style="margin:0;font-size:12px;color:#a8a29e;">destaka.com.br</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail(params: { to: string; name: string }) {
  const { to, name } = params

  const content = `
    <p style="margin:0 0 8px;font-size:16px;color:#57534e;">Olá, ${name}!</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#1c1917;letter-spacing:-0.5px;">
      Bem-vindo à Destaka Saúde
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      Sua assinatura foi confirmada com sucesso. A partir de agora, vamos cuidar da sua presença no Google para que mais pacientes encontrem você.
    </p>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      <strong>O que acontece agora:</strong>
    </p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#57534e;font-size:15px;line-height:1.8;">
      <li>O onboarding começa automaticamente nos próximos minutos</li>
      <li>Vamos conectar e diagnosticar seu perfil do Google</li>
      <li>Você receberá o diagnóstico completo no seu dashboard</li>
    </ul>
    <p style="margin:0 0 32px;color:#57534e;font-size:15px;line-height:1.6;">
      Enquanto isso, você já pode acessar o painel para acompanhar tudo:
    </p>
    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="${APP_URL}/saude/dashboard" style="${BASE_STYLES.cta}">Acessar meu painel</a>
    </td></tr></table>
    <p style="margin:24px 0 0;color:#a8a29e;font-size:13px;line-height:1.6;">
      Qualquer dúvida, responda este e-mail. Estamos aqui para ajudar.
    </p>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Bem-vindo à Destaka Saúde',
    html: baseLayout(content),
  })
}
