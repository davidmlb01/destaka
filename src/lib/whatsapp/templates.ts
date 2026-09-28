// Templates de mensagem WhatsApp para regua pos-contratacao Destaka
// Cada template mapeia para um template aprovado no Meta Business Manager

export interface WhatsAppTemplate {
  name: string
  day: number
  buildParams: (data: OnboardingMessageData) => Record<string, string>
  preview: (data: OnboardingMessageData) => string
}

export interface OnboardingMessageData {
  nome: string
  link: string
  score_atual?: string
  score_inicial?: string
}

export const ONBOARDING_TEMPLATES: WhatsAppTemplate[] = [
  {
    name: 'destaka_onboarding_dia0_boas_vindas',
    day: 0,
    buildParams: (data) => ({
      '1': data.nome,
      '2': data.link,
    }),
    preview: (data) =>
      `Ola, ${data.nome}! Seu perfil no Google ja esta no piloto automatico com o Destaka. Nos proximos 30 dias, vamos otimizar sua presenca online. Acompanhe tudo na sua dashboard: ${data.link}`,
  },
  {
    name: 'destaka_onboarding_dia3_tarefas_manuais',
    day: 3,
    buildParams: (data) => ({
      '1': data.nome,
    }),
    preview: (data) =>
      `${data.nome}, tem 3 coisas que fazem toda diferenca e so voce pode fazer: adicionar fotos reais, responder reviews com seu toque pessoal e manter o horario atualizado. O Destaka cuida do resto.`,
  },
  {
    name: 'destaka_onboarding_dia7_primeiro_resultado',
    day: 7,
    buildParams: (data) => ({
      '1': data.nome,
      '2': data.link,
    }),
    preview: (data) =>
      `${data.nome}, primeira semana concluida! Ja otimizamos seu perfil e publicamos conteudo. Veja o progresso: ${data.link}`,
  },
  {
    name: 'destaka_onboarding_dia14_checkin',
    day: 14,
    buildParams: (data) => ({
      '1': data.nome,
    }),
    preview: (data) =>
      `${data.nome}, como esta a experiencia com o Destaka? Se tiver alguma duvida, responda aqui mesmo.`,
  },
  {
    name: 'destaka_onboarding_dia30_resumo_mensal',
    day: 30,
    buildParams: (data) => ({
      '1': data.nome,
      '2': data.score_atual ?? '0',
      '3': data.score_inicial ?? '0',
      '4': data.link,
    }),
    preview: (data) =>
      `${data.nome}, seu primeiro mes esta completo. Score: ${data.score_atual ?? '0'}/100 (era ${data.score_inicial ?? '0'}). Veja o relatorio: ${data.link}`,
  },
]
