// Templates de mensagem WhatsApp do Destaka
// Cada template mapeia para um template aprovado no Meta Business Manager
// Tom: direto, prático, sem enrolação. Só notifica quando ação é necessária.
// Revisão ortográfica: acentos e concordância verificados.

export interface WhatsAppTemplate {
  name: string
  day: number | null // null = evento (não faz parte da régua por dia)
  category: 'onboarding' | 'action' | 'review'
  buildParams: (data: TemplateData) => Record<string, string>
  preview: (data: TemplateData) => string
}

export interface TemplateData {
  nome: string
  link: string
  score_atual?: string
  score_inicial?: string
  nome_clinica?: string
  autor_review?: string
  rating?: string
  quantidade?: string
}

// ============================================================
// ONBOARDING: régua pós-contratação
// ============================================================

export const ONBOARDING_TEMPLATES: WhatsAppTemplate[] = [
  {
    name: 'destaka_boas_vindas',
    day: 0,
    category: 'onboarding',
    buildParams: (data) => ({
      '1': data.nome,
      '2': data.link,
    }),
    preview: (data) =>
      `Olá, ${data.nome}! Seu perfil no Google já está no piloto automático. A partir de agora, o Destaka cuida de tudo: otimização, posts e avaliações. Acompanhe os resultados aqui: ${data.link}`,
  },
  {
    name: 'destaka_checkin',
    day: 14,
    category: 'onboarding',
    buildParams: (data) => ({
      '1': data.nome,
    }),
    preview: (data) =>
      `Olá, ${data.nome}! Faz 14 dias que o Destaka está cuidando do seu perfil. Alguma dúvida ou sugestão? Responda aqui mesmo.`,
  },
  {
    name: 'destaka_resumo_mensal',
    day: 30,
    category: 'onboarding',
    buildParams: (data) => ({
      '1': data.nome,
      '2': data.score_atual ?? '0',
      '3': data.score_inicial ?? '0',
      '4': data.link,
    }),
    preview: (data) =>
      `${data.nome}, seu primeiro mês no Destaka está completo. Seu score saiu de ${data.score_inicial ?? '0'} para ${data.score_atual ?? '0'}/100. Veja o relatório completo: ${data.link}`,
  },
]

// ============================================================
// AÇÃO NECESSÁRIA: só dispara quando o profissional precisa agir
// ============================================================

export const ACTION_TEMPLATES: WhatsAppTemplate[] = [
  {
    name: 'destaka_reconectar',
    day: null,
    category: 'action',
    buildParams: (data) => ({
      '1': data.nome,
      '2': data.link,
    }),
    preview: (data) =>
      `${data.nome}, a conexão do seu perfil com o Google foi interrompida. Enquanto estiver desconectado, seu perfil não recebe atualizações e perde visibilidade. Reconecte em menos de 1 minuto: ${data.link}`,
  },
  {
    name: 'destaka_nova_avaliacao',
    day: null,
    category: 'action',
    buildParams: (data) => ({
      '1': data.nome,
      '2': data.autor_review ?? 'um cliente',
      '3': data.rating ?? '5',
      '4': data.link,
    }),
    preview: (data) =>
      `${data.nome}, você recebeu uma avaliação de ${data.rating ?? '5'} estrelas de ${data.autor_review ?? 'um cliente'}. Já preparamos uma sugestão de resposta. Aprove ou edite aqui: ${data.link}`,
  },
  {
    name: 'destaka_avaliacao_negativa',
    day: null,
    category: 'action',
    buildParams: (data) => ({
      '1': data.nome,
      '2': data.autor_review ?? 'um cliente',
      '3': data.rating ?? '1',
      '4': data.link,
    }),
    preview: (data) =>
      `Atenção, ${data.nome}: avaliação de ${data.rating ?? '1'} estrela de ${data.autor_review ?? 'um cliente'}. Uma resposta cuidadosa faz diferença para quem está escolhendo um profissional. Responda aqui: ${data.link}`,
  },
  {
    name: 'destaka_posts_pendentes',
    day: null,
    category: 'action',
    buildParams: (data) => ({
      '1': data.nome,
      '2': data.quantidade ?? '1',
      '3': data.link,
    }),
    preview: (data) =>
      `${data.nome}, você tem ${data.quantidade ?? '1'} post${(data.quantidade ?? '1') !== '1' ? 's' : ''} pronto${(data.quantidade ?? '1') !== '1' ? 's' : ''} para publicar no Google. Aprove para manter seu perfil ativo: ${data.link}`,
  },
]

// ============================================================
// REVIEW: pedido de avaliação (enviado pelo número da clínica)
// Estes templates são submetidos separadamente via Kapso
// ============================================================

export const REVIEW_TEMPLATES = {
  com_nome: 'pedido_avaliacao_v1',
  sem_nome: 'pedido_avaliacao_v1_sem_nome',
}

// Todos os templates para registro no Inngest / referência
export const ALL_TEMPLATES = [
  ...ONBOARDING_TEMPLATES,
  ...ACTION_TEMPLATES,
]
