import { resend, FROM } from './index'
import type { CategoryScore } from '@/lib/gmb/scorer'

interface LeadMagnetEmailParams {
  to: string
  placeName: string
  score: number
  categories: CategoryScore[]
}

function scoreColor(score: number): string {
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'Perfil bem otimizado'
  if (score >= 40) return 'Tem espaço para melhorar'
  return 'Precisa de atenção urgente'
}

export async function sendLeadMagnetEmail(params: LeadMagnetEmailParams) {
  const { to, placeName, score, categories } = params
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
      <td style="padding:12px 0;border-bottom:1px solid #e7e5e4;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#1c1917;">${gap.message}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#78716c;">Impacto: +${gap.impact} pts se corrigido</p>
      </td>
    </tr>`).join('')

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#14532D,#0A2E18);border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
          <p style="margin:0;color:#F59E0B;font-size:22px;">✦</p>
          <p style="margin:4px 0 0;color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Desta<span style="color:#F59E0B;">ka</span></p>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Auditoria GMB Gratuita</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;border-radius:0 0 16px 16px;padding:36px;">

          <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1c1917;letter-spacing:-0.3px;">
            Resultado da auditoria
          </h1>
          <p style="margin:0 0 28px;font-size:14px;color:#78716c;">${placeName}</p>

          <!-- Score -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:24px;text-align:center;">
              <p style="margin:0;font-size:60px;font-weight:800;color:${color};line-height:1;">${score}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#78716c;">de 100 pontos</p>
              <p style="margin:10px 0 0;font-size:14px;font-weight:700;color:${color};">${label}</p>
            </td></tr>
          </table>

          <!-- Gaps -->
          ${topGaps.length > 0 ? `
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#57534e;text-transform:uppercase;letter-spacing:0.5px;">
            Principais problemas encontrados
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            ${gapsHtml}
          </table>` : ''}

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(20,83,45,0.06),rgba(20,83,45,0.03));border:1px solid rgba(20,83,45,0.12);border-radius:12px;margin-bottom:8px;">
            <tr><td style="padding:24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:#1c1917;">
                A Destaka corrige isso automaticamente.
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#57534e;line-height:1.5;">
                Conecte seu perfil e veja as otimizações sendo aplicadas em minutos. Sem ação manual da sua parte.
              </p>
              <a href="${appUrl}/login"
                 style="display:inline-block;background:#14532D;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;">
                Começar por R$197/mês
              </a>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#a8a29e;">
            destaka.com.br. Você recebeu este email porque solicitou uma auditoria gratuita.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Sua auditoria GMB: ${score}/100 | ${placeName}`,
    html,
  })
}
