// WhatsApp Review Automation: interface de provedor
// Isola o parceiro (Solution Partner) atras de uma interface.
// Trocar de provedor sem tocar no resto do sistema.

import type { WhatsAppConnection } from './db'

// ============================================================
// Evento normalizado (formato unico independente do parceiro)
// ============================================================

export type NormalizedEventType =
  | 'message_received'    // Mensagem do paciente para a clinica
  | 'echo_sent'           // Eco: mensagem enviada pela clinica pelo app
  | 'delivery_status'     // Status de entrega (sent, delivered, read, failed)
  | 'connection_changed'  // Conexao alterada (connected, disconnected)

export interface NormalizedEvent {
  type: NormalizedEventType
  message_id: string
  phone: string            // E.164 do contato
  contact_name: string | null
  timestamp: Date
  text: string | null      // Texto da mensagem (so para message_received e echo_sent)

  // Campos extras por tipo
  delivery_status?: 'sent' | 'delivered' | 'read' | 'failed'
  connection_status?: 'connected' | 'disconnected'
  is_group?: boolean       // True se for mensagem de grupo (sera ignorada)
  is_from_api?: boolean    // True se foi enviada pela API do Destaka (sera ignorada)
  media_type?: string | null // 'image' | 'video' | 'audio' | 'document' | null
}

// ============================================================
// Resultado de envio de template
// ============================================================

export interface SendResult {
  success: boolean
  provider_message_id: string | null
  error?: string
}

// ============================================================
// Status de conexao
// ============================================================

export interface ConnectionStatus {
  connected: boolean
  phone_number_id: string | null
  display_phone: string | null
  last_event_at: Date | null
}

// ============================================================
// Interface do provedor
// ============================================================

export interface WhatsAppReviewProvider {
  /** Nome do provedor para logging e persistencia */
  readonly name: string

  /** Gera link para a clinica conectar o WhatsApp (tela do parceiro) */
  createSetupLink(orgId: string): Promise<string>

  /** Valida assinatura do webhook (retorna false se invalida) */
  verifyWebhook(headers: Record<string, string>, body: string): boolean

  /** Parseia payload do webhook em eventos normalizados */
  parseEvents(payload: unknown): NormalizedEvent[]

  /** Envia template de pedido de avaliacao */
  sendTemplate(
    connection: WhatsAppConnection,
    to: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<SendResult>

  /** Consulta status da conexao no parceiro */
  getConnectionStatus(connection: WhatsAppConnection): Promise<ConnectionStatus>
}

// ============================================================
// Factory: cria o provedor correto baseado em env
// ============================================================

export type ProviderName = 'fake' | string

export function createReviewProvider(name?: ProviderName): WhatsAppReviewProvider {
  const providerName = name ?? process.env.WA_REVIEW_PROVIDER ?? 'fake'

  switch (providerName) {
    case 'kapso': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { KapsoReviewProvider } = require('@/lib/kapso/review-adapter')
      return new KapsoReviewProvider()
    }
    case 'fake': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { FakeProvider } = require('./fake-provider')
      return new FakeProvider()
    }
    default:
      throw new Error(
        `[wa-reviews] Provedor '${providerName}' nao implementado. ` +
        `Provedores disponiveis: kapso, fake.`
      )
  }
}
