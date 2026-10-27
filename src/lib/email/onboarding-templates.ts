// Templates HTML da régua de email pós-contratação (onboarding)
// 6 emails: dia 0, 1, 3, 7, 14, 30

import { escapeHtml } from '@/lib/utils/escape-html'
import { getVocab, getBrandName } from '@/lib/vertical-vocab'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'
const WHATSAPP_NUMBER = process.env.DESTAKA_WHATSAPP_NUMBER ?? ''
const SUPPORT_EMAIL = 'suporte@destaka.com.br'

function layout(content: string, specialty?: string | null): string {
  const vocab = getVocab(specialty)
  const brandSuffix = vocab.brandLabel ? `<span style="font-size:18px;font-weight:300;color:rgba(255,255,255,0.5);letter-spacing:-0.015em;line-height:1;margin-left:4px;">${vocab.brandLabel}</span>` : ''
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

    <!-- Body -->
    <tr><td style="background:#ffffff;padding:36px;">
      ${content}
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
      <p style="font-size:13px;color:#4b5563;margin:0;font-weight:500;">
        ${vocab.emailFooter}
      </p>
    </td></tr>


  </table>
  </td></tr>
</table>
</body>
</html>`
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#0f766e;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-top:8px;">
  ${text}
</a>`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px;line-height:1.3;">${text}</h1>`
}

function paragraph(text: string): string {
  return `<p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 16px;">${text}</p>`
}

function supportLine(): string {
  return `<p style="font-size:13px;color:#4b5563;margin:16px 0 0;line-height:1.6;">Alguma dúvida? Escreva para <a href="mailto:${SUPPORT_EMAIL}" style="color:#0f766e;font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a></p>`
}

function highlight(text: string): string {
  return `<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:20px;margin:0 0 24px;">
  <p style="font-size:15px;color:#134e4a;line-height:1.6;margin:0;">${text}</p>
</div>`
}

// ─────────────────────────────────────────────
// Dia 0: Boas-vindas
// ─────────────────────────────────────────────
export function templateDay0(firstName: string, gender?: 'M' | 'F', specialty?: string | null): { subject: string; html: string } {
  const v = getVocab(specialty)
  const brand = getBrandName(specialty)
  const subject = `Pronto. Seu ${v.local} vai aparecer para mais ${v.clientes}`
  const bemVindo = gender === 'F' ? 'bem-vinda' : 'bem-vindo'

  const html = layout(`
    ${heading(`${escapeHtml(firstName)}, ${bemVindo} ao ${brand}`)}
    ${paragraph(`A partir de agora, o ${brand} trabalha todos os dias para que ${v.clientes} da sua região encontrem você primeiro no Google. Sem precisar mexer em nada. Nos próximos 30 dias, o ${brand} vai:`)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#111827;"><strong>1.</strong> Otimizar seu perfil no Google para aparecer nas buscas certas da sua especialidade</p>
      </td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#111827;"><strong>2.</strong> Publicar conteúdo no seu perfil para que o Google entenda que você está ativo e relevante</p>
      </td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#111827;"><strong>3.</strong> Responder avaliações de ${v.clientes} para manter sua reputação forte</p>
      </td></tr>
      <tr><td style="padding:12px 0;">
        <p style="margin:0;font-size:14px;color:#111827;"><strong>4.</strong> Medir seu Score ${brand} todos os dias para acompanhar os resultados</p>
      </td></tr>
    </table>

    ${highlight(`Não precisa fazer nada. O ${brand} já está trabalhando no seu perfil agora. Amanhã seu Score ${brand} inicial estará pronto, o ponto de partida para acompanhar o crescimento da sua visibilidade.`)}

    ${button('Ver meu painel', `${APP_URL}/dashboard`)}

    ${supportLine()}
  `, specialty)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 1: Score inicial + contexto prático
// ─────────────────────────────────────────────
export function templateDay1(firstName: string, orgName: string, initialScore: number, specialty?: string | null): { subject: string; html: string } {
  const v = getVocab(specialty)
  const brand = getBrandName(specialty)
  const subject = `Seu Score ${brand}: ${initialScore}/100. Veja o que isso significa.`

  const html = layout(`
    ${heading(`${escapeHtml(firstName)}, esse número define quantos ${v.clientes} encontram você hoje`)}
    ${paragraph(`O perfil de <strong>${escapeHtml(orgName)}</strong> foi analisado e o seu Score ${brand} inicial é:`)}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;margin:0 0 24px;">
      <tr><td style="padding:24px;text-align:center;">
        <p style="margin:0;font-size:60px;font-weight:800;color:#0f766e;line-height:1;">${initialScore}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#4b5563;">de 100 pontos</p>
      </td></tr>
    </table>

    ${paragraph(`Esse número reflete o quanto seu perfil está visível para ${v.clientes} que buscam profissionais como você no Google agora. Quanto maior o score, mais você aparece. O ${brand} vai trabalhar todos os dias para subir esse número.`)}

    ${paragraph('As primeiras ações já estão em andamento:')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#111827;">Otimização da descrição e categorias do perfil</p>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#111827;">Ajuste de atributos para melhor posicionamento no Maps</p>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#111827;">Publicação dos primeiros posts no seu perfil</p>
      </td></tr>
      <tr><td style="padding:10px 0;">
        <p style="margin:0;font-size:14px;color:#111827;">Monitoramento de avaliações ativado</p>
      </td></tr>
    </table>

    ${highlight(`Cada ponto a mais no seu score significa mais ${v.clientes} encontrando você antes dos outros profissionais da sua região. Acompanhe no painel.`)}

    ${button('Ver meu score e evolução', `${APP_URL}/dashboard`)}
  `, specialty)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 3: Como acelerar o crescimento
// ─────────────────────────────────────────────
export function templateDay3(firstName: string, specialty?: string | null): { subject: string; html: string } {
  const v = getVocab(specialty)
  const brand = getBrandName(specialty)
  const subject = '2 ações que seus concorrentes mais bem posicionados já fazem'

  const html = layout(`
    ${heading(`${escapeHtml(firstName)}, o ${brand} cuida de 80%. Esses 20% só você pode fazer.`)}
    ${paragraph(`O ${brand} otimiza, publica e monitora no piloto automático. Mas os perfis que mais atraem ${v.clientes} no Google têm duas coisas que só o profissional pode fornecer:`)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="padding:16px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">1. Peça avaliações (o fator #1 do algoritmo do Google)</p>
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.5;">Avaliações são o fator de maior peso no ranking do Google. Profissionais com mais de 30 avaliações recebem até 3x mais cliques no perfil. Dica prática: ao final do ${v.atendimento}, diga "Se puder deixar uma avaliação no Google, ajuda muito outros ${v.clientes} a me encontrarem". Simples e eficaz.</p>
      </td></tr>
      <tr><td style="padding:16px 0;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">2. Envie fotos reais (perfis com fotos recebem 42% mais pedidos de rota)</p>
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.5;">Fotos da recepção, da equipe, do ambiente de atendimento. Perfis com fotos recentes recebem significativamente mais interações. Basta tirar 3 a 5 fotos com o celular e responder este email com elas. Nós publicamos para você.</p>
      </td></tr>
    </table>

    ${highlight(`O ${brand} cuida de posts, otimização, respostas e monitoramento. Avaliações e fotos são o que separa os perfis bons dos perfis que dominam a busca na região.`)}

    ${button('Ver meu score atual', `${APP_URL}/dashboard`)}

    ${supportLine()}
  `, specialty)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 7: Primeiro resultado
// ─────────────────────────────────────────────
export function templateDay7(firstName: string, orgName: string, postsCount: number, scoreDelta: number, specialty?: string | null): { subject: string; html: string } {
  const v = getVocab(specialty)
  const brand = getBrandName(specialty)
  const subject = scoreDelta > 0
    ? `7 dias, +${scoreDelta} pontos. Veja o que já mudou.`
    : `7 dias de ${brand}. Veja o progresso.`

  const html = layout(`
    ${heading(`${escapeHtml(firstName)}, 7 dias. Zero esforço seu. Veja os resultados.`)}
    ${paragraph(`Em 7 dias, o ${brand} trabalhou no perfil de <strong>${escapeHtml(orgName)}</strong> sem precisar fazer nada. Aqui está o que já aconteceu:`)}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:20px;margin:0 0 24px;">
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:14px;color:#4b5563;">Descrição do perfil otimizada com palavras-chave relevantes</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:14px;color:#4b5563;">Categorias e atributos ajustados para melhor posicionamento</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:14px;color:#4b5563;">${postsCount} post${postsCount !== 1 ? 's publicados' : ' publicado'} no seu perfil</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:14px;color:#4b5563;">Score ${brand} calculado diariamente</p>
      </td></tr>
    </table>

    ${scoreDelta > 0
      ? highlight(`Seu score subiu ${scoreDelta} ponto${scoreDelta !== 1 ? 's' : ''} em 7 dias. Isso significa que mais ${v.clientes} estão encontrando seu perfil nas buscas. E o ${brand} continua trabalhando todos os dias para subir ainda mais.`)
      : highlight('As otimizações dos primeiros dias levam de 7 a 14 dias para refletir no ranking do Google. O trabalho está feito, os resultados estão a caminho. Acompanhe no painel.')}

    ${button('Ver resultados da semana', `${APP_URL}/dashboard`)}
  `, specialty)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 14: Check-in com reafirmação de valor
// ─────────────────────────────────────────────
export function templateDay14(firstName: string, specialty?: string | null): { subject: string; html: string } {
  const brand = getBrandName(specialty)
  const subject = '14 dias no piloto automático. Seu perfil continua crescendo.'

  const whatsappUrl = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : ''

  const html = layout(`
    ${heading(`${escapeHtml(firstName)}, 14 dias e o ${brand} não parou um dia`)}
    ${paragraph(`Nos últimos 14 dias, o ${brand} publicou conteúdo, respondeu avaliações, otimizou categorias e monitorou seu perfil no Google. Tudo sem precisar abrir o painel uma única vez. Esse trabalho consistente é o que faz o Google priorizar seu perfil sobre os concorrentes da região.`)}
    ${paragraph(`Se quiser ver os números ou tiver qualquer dúvida, estamos aqui. Mas saiba: mesmo que não olhe, o ${brand} continua trabalhando.`)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td>
        ${button('Ver meu score atualizado', `${APP_URL}/dashboard`)}
      </td></tr>
      ${whatsappUrl ? `<tr><td style="padding-top:12px;">
        <a href="${whatsappUrl}" style="display:inline-block;background:#ffffff;color:#111827;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;border:1px solid #e5e7eb;">
          Falar no WhatsApp
        </a>
      </td></tr>` : ''}
    </table>

    ${highlight('Em 16 dias você recebe o relatório completo do primeiro mês, com todas as métricas de visibilidade e engajamento do seu perfil.')}

    ${supportLine()}
  `, specialty)

  return { subject, html }
}

// ─────────────────────────────────────────────
// Dia 30: Resumo mensal com métricas traduzidas
// ─────────────────────────────────────────────
interface Day30Data {
  firstName: string
  orgName: string
  scoreInitial: number
  scoreCurrent: number
  postsCount: number
  reviewsCount: number
  profileViews?: number
  websiteClicks?: number
  phoneClicks?: number
  whatsappClicks?: number
  specialty?: string | null
}

export function templateDay30(data: Day30Data): { subject: string; html: string } {
  const { firstName, orgName, scoreInitial, scoreCurrent, postsCount, reviewsCount, specialty } = data
  const v = getVocab(specialty)
  const brand = getBrandName(specialty)
  const scoreDelta = scoreCurrent - scoreInitial
  const subject = `30 dias. +${scoreDelta > 0 ? scoreDelta : 0} pontos. Veja o impacto no seu ${v.local}.`

  const metricsRows: string[] = []

  if (data.profileViews && data.profileViews > 0) {
    metricsRows.push(`<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0;font-size:14px;color:#4b5563;"><strong>${data.profileViews.toLocaleString('pt-BR')}</strong> pessoas viram seu perfil no Google</p>
    </td></tr>`)
  }
  if (data.websiteClicks && data.websiteClicks > 0) {
    metricsRows.push(`<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0;font-size:14px;color:#4b5563;"><strong>${data.websiteClicks}</strong> visitaram seu site a partir do Google</p>
    </td></tr>`)
  }
  if (data.phoneClicks && data.phoneClicks > 0) {
    metricsRows.push(`<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0;font-size:14px;color:#4b5563;"><strong>${data.phoneClicks}</strong> ligaram para agendar pelo Google</p>
    </td></tr>`)
  }
  if (data.whatsappClicks && data.whatsappClicks > 0) {
    metricsRows.push(`<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0;font-size:14px;color:#4b5563;"><strong>${data.whatsappClicks}</strong> mandaram mensagem pelo Google</p>
    </td></tr>`)
  }

  const html = layout(`
    ${heading(`${escapeHtml(firstName)}, 30 dias no piloto automático. Aqui está o resultado.`)}
    ${paragraph(`Nos últimos 30 dias, o ${brand} trabalhou no perfil de <strong>${escapeHtml(orgName)}</strong> todos os dias, sem precisar dedicar um minuto sequer a isso.`)}

    <!-- Score comparativo -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td align="center" style="background:#f9fafb;border-radius:10px;padding:20px;width:45%;">
          <p style="margin:0;font-size:12px;color:#4b5563;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Score inicial</p>
          <p style="margin:4px 0 0;font-size:36px;font-weight:800;color:#6b7280;line-height:1;">${scoreInitial}</p>
        </td>
        <td style="width:10%;text-align:center;">
          <p style="margin:0;font-size:20px;color:#0f766e;font-weight:700;">→</p>
        </td>
        <td align="center" style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:20px;width:45%;">
          <p style="margin:0;font-size:12px;color:#134e4a;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Score atual</p>
          <p style="margin:4px 0 0;font-size:36px;font-weight:800;color:#0f766e;line-height:1;">${scoreCurrent}</p>
          ${scoreDelta > 0 ? `<p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#0f766e;">+${scoreDelta} pontos</p>` : ''}
        </td>
      </tr>
    </table>

    <!-- Ações realizadas -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:20px;margin:0 0 24px;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#4b5563;"><strong>${postsCount}</strong> post${postsCount !== 1 ? 's publicados' : ' publicado'} no seu perfil</p>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;color:#4b5563;"><strong>${reviewsCount}</strong> ${reviewsCount !== 1 ? 'avaliações respondidas' : 'avaliação respondida'}</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:14px;color:#4b5563;">Descrição, categorias e atributos otimizados</p>
      </td></tr>
    </table>

    ${metricsRows.length > 0 ? `
    <!-- Métricas traduzidas -->
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;">${v.clientes.charAt(0).toUpperCase() + v.clientes.slice(1)} que encontraram você pelo Google</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      ${metricsRows.join('')}
    </table>` : ''}

    ${paragraph(`O algoritmo do Google recompensa quem é consistente. Perfis que mantêm atividade por 60+ dias ganham prioridade sobre concorrentes que param e voltam. O ${brand} garante essa consistência todos os dias, para você focar no que importa: atender seus ${v.clientes}.`)}

    ${button('Ver relatório completo', `${APP_URL}/dashboard`)}

    ${paragraph('A partir de agora, ao final de cada mês você recebe um email como este com o relatório completo da evolução do seu perfil.')}

    ${supportLine()}
  `, specialty)

  return { subject, html }
}
