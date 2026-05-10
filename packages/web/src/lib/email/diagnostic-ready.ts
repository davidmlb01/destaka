import { resend, FROM } from './index'
import { getScoreColor, getScoreLabel } from '@/lib/utils/score-colors'

interface DiagnosticReadyParams {
  to: string
  name: string
  profileName: string
  score: number
}

function scoreLabel(score: number): string {
  return getScoreLabel(score)
}

function scoreColor(score: number): string {
  return getScoreColor(score)
}

export async function sendDiagnosticReadyEmail(params: DiagnosticReadyParams) {
  const { to, name, profileName, score } = params
  const label = scoreLabel(score)
  const color = scoreColor(score)

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#161B26,#0F1117);padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#0EA5E9;font-size:24px;">✦</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
            Desta<span style="color:#0EA5E9;">ka</span>
          </p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:16px;color:#57534e;">Olá, ${name}</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#1c1917;letter-spacing:-0.5px;">
            Seu diagnóstico ficou pronto.
          </h1>
          <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.6;">
            Analisamos o perfil <strong>${profileName}</strong> no Google Meu Negócio e calculamos seu score.
          </p>
          <!-- Score -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:24px;text-align:center;">
              <p style="margin:0;font-size:56px;font-weight:800;color:${color};">${score}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#78716c;">de 100 pontos</p>
              <p style="margin:8px 0 0;font-size:14px;font-weight:700;color:${color};">${label}</p>
            </td></tr>
          </table>
          <p style="margin:0 0 32px;color:#57534e;font-size:15px;line-height:1.6;">
            Acesse o dashboard para ver o diagnóstico completo, os problemas identificados e o plano de ação para melhorar seu score.
          </p>
          <!-- CTA -->
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
               style="display:inline-block;background:#0284C7;color:#1C1917;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;">
              Ver diagnóstico completo
            </a>
          </td></tr></table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #e7e5e4;text-align:center;">
          <p style="margin:0;font-size:12px;color:#a8a29e;">destaka.com.br — Apareça para quem precisa de você.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Seu diagnóstico ficou pronto: ${score}/100 — ${profileName}`,
    html,
  })
}
