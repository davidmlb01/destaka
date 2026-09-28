// Templates HTML da regua de email pos-contratacao (onboarding)
// 7 emails: dia 0, 1, 3, 7, 14, 21, 30

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'
const WHATSAPP_URL = 'https://wa.me/5511999999999' // TODO: substituir pelo numero real

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
  <tr><td align="center">
  <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

    <!-- Header -->
    <tr><td style="background:#111827;border-radius:16px 16px 0 0;padding:28px 36px;">
      <p style="color:#6b7280;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 8px;">Destaka</p>
    </td></tr>

    <!-- Body -->
    <tr><td style="background:#ffffff;padding:36px;">
      ${content}
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
      <p style="font-size:13px;color:#6b7280;margin:0 0 4px;font-weight:500;">
        Voce cuida dos seus pacientes. O Destaka cuida do seu Google.
      </p>
      <p style="font-size:11px;color:#9ca3af;margin:0;">
        destaka.com.br
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#111827;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-top:8px;">
  ${text}
</a>`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px;line-height:1.3;">${text}</h1>`
}

function paragraph(text: string): string {
  return `<p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 16px;">${text}</p>`
}

function highlight(text: string): string {
  return `<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:20px;margin:0 0 24px;">
  <p style="font-size:14px;color:#134e4a;line-height:1.6;margin:0;">${text}</p>
</div>`
}

// ─────────────────────────────────────────────
// Dia 0: Boas-vindas
// ─────────────────────────────────────────────
export function templateDay0(firstName: string): { subject: string; html: string } {
  const subject = 'Seu perfil ja esta no piloto automatico'

  const html = layout(`
    ${heading(`${firstName}, bem-vindo ao Destaka.`)}
    ${paragraph('A partir de agora, seu perfil no Google esta sendo cuidado automaticamente. Nos proximos 30 dias, o Destaka vai:')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#111827;"><strong>1.</strong> Otimizar seu perfil no Google (descricao, categorias, atributos)</p>
      </td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#111827;"><strong>2.</strong> Publicar posts automaticos no seu nome</p>
      </td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#111827;"><strong>3.</strong> Monitorar e responder avaliacoes de pacientes</p>
      </td></tr>
      <tr><td style="padding:12px 0;">
        <p style="margin:0;font-size:14px;color:#111827;"><strong>4.</strong> Calcular seu Score Destaka diariamente</p>
      </td></tr>
    </table>

    ${highlight('Voce nao precisa fazer nada. O sistema ja esta trabalhando. Amanha voce recebe seu primeiro diagnostico com o score inicial.')}

    ${button('Ver minha dashboard', `${APP_URL}/dashboard`)}
  `)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 1: Primeiro diagnostico
// ─────────────────────────────────────────────
export function templateDay1(firstName: string): { subject: string; html: string } {
  const subject = 'Seu score inicial: veja onde voce esta'

  const html = layout(`
    ${heading(`${firstName}, seu diagnostico inicial esta pronto.`)}
    ${paragraph('O Score Destaka analisa 5 dimensoes do seu perfil no Google. Cada uma tem peso diferente na forma como o Google decide quem aparece primeiro nos resultados.')}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:20px;margin:0 0 24px;">
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:13px;color:#374151;"><strong>Completude do Perfil</strong> (25 pts): descricao, categorias, fotos, horarios</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:13px;color:#374151;"><strong>Reputacao</strong> (25 pts): nota media, volume e taxa de resposta das avaliacoes</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:13px;color:#374151;"><strong>Visibilidade</strong> (20 pts): frequencia de posts, atividade recente</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:13px;color:#374151;"><strong>Retencao</strong> (20 pts): engajamento, respostas personalizadas</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:13px;color:#374151;"><strong>Conversao</strong> (10 pts): CTA, links, informacoes de contato</p>
      </td></tr>
    </table>

    ${paragraph('A maioria dos profissionais comeca entre 20 e 40 pontos. Em 30 dias, voce vai ver a diferenca.')}

    ${button('Ver meu score', `${APP_URL}/dashboard`)}
  `)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 3: Tarefas manuais
// ─────────────────────────────────────────────
export function templateDay3(firstName: string): { subject: string; html: string } {
  const subject = '3 coisas que so voce pode fazer'

  const html = layout(`
    ${heading(`${firstName}, o Destaka cuida de quase tudo. Mas tem 3 coisas que fazem toda a diferenca quando vem de voce.`)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="padding:16px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">1. Adicione fotos reais</p>
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.5;">Fotos do consultorio, da equipe, da fachada. O Google prioriza perfis com imagens autenticas. Fotos de banco de imagens nao contam.</p>
      </td></tr>
      <tr><td style="padding:16px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">2. Responda avaliacoes com toque pessoal</p>
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.5;">O Destaka sugere respostas automaticas, mas quando voce adiciona uma palavra pessoal, o paciente percebe. Isso gera confianca.</p>
      </td></tr>
      <tr><td style="padding:16px 0;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">3. Mantenha o horario de funcionamento atualizado</p>
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.5;">Feriados, ferias, mudanca de expediente. Quando o horario esta errado, o Google reduz a relevancia do perfil.</p>
      </td></tr>
    </table>

    ${highlight('O Destaka cuida do resto: posts, otimizacao, monitoramento, score. Essas 3 coisas sao o seu diferencial.')}

    ${button('Acessar dashboard', `${APP_URL}/dashboard`)}
  `)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 7: Primeiro resultado
// ─────────────────────────────────────────────
export function templateDay7(firstName: string, orgName: string): { subject: string; html: string } {
  const subject = '7 dias: o que ja mudou no seu perfil'

  const html = layout(`
    ${heading(`${firstName}, uma semana de Destaka.`)}
    ${paragraph(`Nos primeiros 7 dias, o sistema trabalhou no perfil de <strong>${orgName}</strong>. Aqui esta o que ja foi feito:`)}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:20px;margin:0 0 24px;">
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:14px;color:#374151;">Descricao do perfil otimizada com palavras-chave relevantes</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:14px;color:#374151;">Categorias e atributos ajustados para melhor posicionamento</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:14px;color:#374151;">Posts publicados automaticamente no seu perfil</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:14px;color:#374151;">Score Destaka calculado diariamente</p>
      </td></tr>
    </table>

    ${paragraph('Acesse a dashboard para ver os numeros detalhados e acompanhar a evolucao do seu score.')}

    ${button('Ver resultados', `${APP_URL}/dashboard`)}
  `)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 14: Check-in
// ─────────────────────────────────────────────
export function templateDay14(firstName: string): { subject: string; html: string } {
  const subject = 'Como esta sendo a experiencia?'

  const html = layout(`
    ${heading(`${firstName}, tudo certo por ai?`)}
    ${paragraph('Ja faz duas semanas que o Destaka esta cuidando do seu perfil no Google. O sistema continua trabalhando todos os dias, mesmo quando voce nao percebe.')}
    ${paragraph('Se tiver qualquer duvida sobre o que esta acontecendo, sobre o score ou sobre as otimizacoes, estamos aqui.')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding-right:8px;">
          ${button('Ver dashboard', `${APP_URL}/dashboard`)}
        </td>
        <td>
          <a href="${WHATSAPP_URL}" style="display:inline-block;background:#ffffff;color:#111827;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;border:1px solid #e5e7eb;margin-top:8px;">
            Falar no WhatsApp
          </a>
        </td>
      </tr>
    </table>

    ${highlight('O piloto automatico nao para. Seu proximo relatorio completo chega no final do mes.')}
  `)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 21: Prova social
// ─────────────────────────────────────────────
export function templateDay21(firstName: string): { subject: string; html: string } {
  const subject = 'Perfis como o seu ja subiram mais de 20 pontos'

  const html = layout(`
    ${heading(`${firstName}, voce esta no caminho certo.`)}
    ${paragraph('Profissionais que usam o Destaka por 30 dias ou mais costumam ver uma evolucao media de 20 a 35 pontos no Score Destaka. Isso significa mais visibilidade no Google Maps e mais pacientes encontrando o perfil.')}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:24px;margin:0 0 24px;">
      <tr><td>
        <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#134e4a;">O que faz a diferenca:</p>
        <p style="margin:0;font-size:14px;color:#134e4a;line-height:1.6;">
          Perfil completo + posts frequentes + avaliacoes respondidas. O Destaka cuida dos dois primeiros. As avaliacoes, voce complementa com o toque pessoal.
        </p>
      </td></tr>
    </table>

    ${paragraph('Acesse a dashboard para acompanhar como esta a sua evolucao.')}

    ${button('Ver meu progresso', `${APP_URL}/dashboard`)}
  `)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 30: Resumo mensal
// ─────────────────────────────────────────────
export function templateDay30(firstName: string, orgName: string): { subject: string; html: string } {
  const subject = 'Seu primeiro mes com o Destaka'

  const html = layout(`
    ${heading(`${firstName}, um mes completo.`)}
    ${paragraph(`O Destaka trabalhou no perfil de <strong>${orgName}</strong> todos os dias nos ultimos 30 dias. Descricao otimizada, posts publicados, avaliacoes monitoradas, score calculado diariamente.`)}

    ${highlight('Acesse a dashboard para ver o comparativo completo: score inicial versus score atual, posts publicados, avaliacoes respondidas e visualizacoes do seu perfil.')}

    ${paragraph('Continue no piloto automatico. O proximo mes vai ser ainda melhor. O algoritmo do Google recompensa consistencia, e o Destaka garante isso para voce.')}

    ${button('Ver resumo completo', `${APP_URL}/dashboard`)}

    <p style="font-size:13px;color:#9ca3af;margin:24px 0 0;line-height:1.5;">
      Seu relatorio mensal detalhado sera enviado separadamente com todos os numeros.
    </p>
  `)

  return { subject, html }
}
