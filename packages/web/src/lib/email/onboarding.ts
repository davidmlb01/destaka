import { resend, FROM } from './index'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

const BASE_STYLES = {
  body: 'margin:0;padding:0;background:#f5f5f4;font-family:Inter,Arial,sans-serif;',
  outer: 'background:#f5f5f4;padding:32px 0;',
  card: 'background:#ffffff;border-radius:16px;overflow:hidden;',
  header: 'background:linear-gradient(135deg,#14532D,#0A2E18);padding:32px 40px;text-align:center;',
  body_cell: 'padding:40px;',
  footer: 'padding:24px 40px;border-top:1px solid #e7e5e4;text-align:center;',
  cta: 'display:inline-block;background:#D97706;color:#1C1917;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;',
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
          <p style="margin:0;color:#F59E0B;font-size:24px;">✦</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
            Desta<span style="color:#F59E0B;">ka</span>
          </p>
        </td></tr>
        <tr><td style="${BASE_STYLES.body_cell}">${content}</td></tr>
        <tr><td style="${BASE_STYLES.footer}">
          <p style="margin:0;font-size:12px;color:#a8a29e;">destaka.com.br — Apareça para quem precisa de você.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// Dia 1: Boas-vindas + o que acontece agora
export async function sendOnboardingDay1(params: { to: string; name: string; profileName: string }) {
  const { to, name, profileName } = params

  const content = `
    <p style="margin:0 0 8px;font-size:16px;color:#57534e;">Olá, ${name}</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#1c1917;letter-spacing:-0.5px;">
      Seu perfil está nas mãos da Destaka.
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      Conectamos o perfil <strong>${profileName}</strong> e já fizemos o diagnóstico completo: score calculado, problemas identificados, plano de ação pronto.
    </p>
    <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.6;">
      A partir de agora a Destaka cuida do seu Google Meu Negócio automaticamente: posts semanais, respostas a avaliações e monitoramento contínuo do score.
    </p>
    <p style="margin:0 0 32px;color:#57534e;font-size:15px;line-height:1.6;">
      Acesse o dashboard para ver o diagnóstico e acompanhar a evolução.
    </p>
    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="${APP_URL}/dashboard" style="${BASE_STYLES.cta}">Ver meu diagnóstico</a>
    </td></tr></table>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${name}, seu perfil já está sendo cuidado pela Destaka`,
    html: baseLayout(content),
  })
}

// Dia 3: Primeiros resultados + urgência
export async function sendOnboardingDay3(params: { to: string; name: string; profileName: string; score: number }) {
  const { to, name, profileName, score } = params

  const content = `
    <p style="margin:0 0 8px;font-size:16px;color:#57534e;">Olá, ${name}</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#1c1917;letter-spacing:-0.5px;">
      3 dias. Seu score é ${score}/100.
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      O perfil <strong>${profileName}</strong> já está sob monitoramento ativo. Identificamos os principais problemas e já começamos a resolver.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:24px;text-align:center;">
        <p style="margin:0;font-size:48px;font-weight:800;color:#D97706;">${score}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#78716c;">Score atual de 100</p>
      </td></tr>
    </table>
    <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.6;">
      Cada ponto de score representa pacientes que encontram seu consultório antes dos concorrentes. A Destaka está aumentando esse número, semana a semana.
    </p>
    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="${APP_URL}/dashboard" style="${BASE_STYLES.cta}">Ver evolução do score</a>
    </td></tr></table>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Score ${score}/100: veja o que a Destaka já fez pelo ${profileName}`,
    html: baseLayout(content),
  })
}

// Dia 7: Check-in de 1 semana + indicação
export async function sendOnboardingDay7(params: { to: string; name: string; profileName: string; score: number }) {
  const { to, name, profileName, score } = params

  const content = `
    <p style="margin:0 0 8px;font-size:16px;color:#57534e;">Olá, ${name}</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#1c1917;letter-spacing:-0.5px;">
      1 semana com a Destaka.
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      O <strong>${profileName}</strong> completou uma semana de otimização contínua. Score atual: <strong>${score}/100</strong>.
    </p>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      A Destaka já publicou posts, monitorou avaliações e identificou os próximos pontos de melhoria.
    </p>
    <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.6;">
      Conhece outro dentista ou médico que deveria aparecer mais no Google? Indique a Destaka e ganhe 30 dias gratuitos para cada indicação que assinar.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td>
      <a href="${APP_URL}/dashboard" style="${BASE_STYLES.cta}">Ver dashboard completo</a>
    </td></tr></table>
    <p style="margin:0;color:#a8a29e;font-size:13px;line-height:1.6;">
      Para indicar, basta responder este e-mail com o nome e contato do colega. Cuidamos do resto.
    </p>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `1 semana de Destaka: score ${score}/100 — ${profileName}`,
    html: baseLayout(content),
  })
}
