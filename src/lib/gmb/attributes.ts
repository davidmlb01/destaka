// =============================================================================
// DESTAKA — Atributos do Google Business Profile
// Mapa curado de atributos relevantes para profissionais de saúde no Brasil.
//
// Os IDs seguem o padrão da GBP API v1:
//   attribute/{attribute_id}
//
// Nota: IDs definitivos devem ser validados via
//   GET mybusinessbusinessinformation.googleapis.com/v1/attributes
//     ?categoryName=categories/{gcid}
//     &regionCode=BR
//     &languageCode=pt
// quando a quota da API for restaurada (ticket 0-2582000041216).
// =============================================================================

export interface GmbAttribute {
  id: string     // ID no formato da GBP API
  label: string  // Label exibido ao profissional
  group: string  // Agrupamento visual no setup
}

export const HEALTH_ATTRIBUTES: GmbAttribute[] = [
  // Acessibilidade
  { id: 'has_wheelchair_accessible_entrance', label: 'Entrada acessível para cadeirantes', group: 'Acessibilidade' },
  { id: 'has_wheelchair_accessible_restroom', label: 'Banheiro acessível', group: 'Acessibilidade' },
  { id: 'has_wheelchair_accessible_seating', label: 'Sala de espera acessível', group: 'Acessibilidade' },

  // Estacionamento
  { id: 'has_parking', label: 'Estacionamento disponível', group: 'Estacionamento' },
  { id: 'has_free_parking_lot', label: 'Estacionamento gratuito', group: 'Estacionamento' },

  // Pagamento
  { id: 'pay_credit_card', label: 'Aceita cartão de crédito', group: 'Pagamento' },
  { id: 'pay_debit_card', label: 'Aceita cartão de débito', group: 'Pagamento' },
  { id: 'pay_cash_only', label: 'Aceita dinheiro', group: 'Pagamento' },

  // Atendimento
  { id: 'accepts_new_patients', label: 'Aceita novos pacientes', group: 'Atendimento' },
  { id: 'has_online_appointments', label: 'Agendamento online disponível', group: 'Atendimento' },
  { id: 'telehealth_provider', label: 'Teleconsulta disponível', group: 'Atendimento' },
  { id: 'accepts_insurance', label: 'Aceita plano de saúde / convênio', group: 'Atendimento' },

  // Infraestrutura
  { id: 'has_wifi', label: 'Wi-Fi gratuito na sala de espera', group: 'Infraestrutura' },
]

export const ATTRIBUTE_GROUPS = ['Acessibilidade', 'Estacionamento', 'Pagamento', 'Atendimento', 'Infraestrutura']

/**
 * Converte atributos selecionados para o formato esperado pelo PATCH da GBP API.
 */
export function attributesToGbpFormat(selectedIds: string[]) {
  return selectedIds.map(id => ({
    name: `attribute/${id}`,
    values: ['true'],
  }))
}
