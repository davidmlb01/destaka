// WhatsApp Review Automation: FakeProvider
// Provedor falso para testes e desenvolvimento.
// Nenhuma chamada real a Meta ou parceiro.
// Usa arquivos de exemplo sinteticos para cada tipo de evento.

import type { WhatsAppConnection } from './db'
import type {
  WhatsAppReviewProvider,
  NormalizedEvent,
  SendResult,
  ConnectionStatus,
} from './provider'
import crypto from 'crypto'

// ============================================================
// Payloads sinteticos de exemplo (simulam webhook do parceiro)
// ============================================================

export interface FakeWebhookPayload {
  events: FakeRawEvent[]
  signature?: string
}

export interface FakeRawEvent {
  type: 'message' | 'echo' | 'status' | 'connection'
  id: string
  phone: string
  name?: string
  timestamp: string
  text?: string
  status?: 'sent' | 'delivered' | 'read' | 'failed'
  connection_status?: 'connected' | 'disconnected'
  is_group?: boolean
  is_from_api?: boolean
  media_type?: string
}

// Exemplos sinteticos: um para cada tipo de evento
// Textos sao sinteticos e NAO contem dados reais de pacientes
export const SYNTHETIC_EVENTS: Record<string, FakeRawEvent> = {
  // Mensagem recebida: paciente confirma consulta
  message_received: {
    type: 'message',
    id: 'fake_msg_001',
    phone: '+5521999000001',
    name: 'Maria Teste',
    timestamp: new Date().toISOString(),
    text: 'Oi, confirmado para amanha as 14h. Obrigada!',
  },

  // Eco: clinica envia confirmacao pelo app
  echo_sent: {
    type: 'echo',
    id: 'fake_msg_002',
    phone: '+5521999000001',
    name: 'Maria Teste',
    timestamp: new Date().toISOString(),
    text: 'Olá Maria! Sua consulta está confirmada para amanhã, dia 25/11, às 14h. Até lá!',
  },

  // Status de entrega: template enviado
  delivery_sent: {
    type: 'status',
    id: 'fake_msg_003',
    phone: '+5521999000001',
    timestamp: new Date().toISOString(),
    status: 'sent',
  },

  // Status de entrega: entregue
  delivery_delivered: {
    type: 'status',
    id: 'fake_msg_003',
    phone: '+5521999000001',
    timestamp: new Date().toISOString(),
    status: 'delivered',
  },

  // Status de entrega: lido
  delivery_read: {
    type: 'status',
    id: 'fake_msg_003',
    phone: '+5521999000001',
    timestamp: new Date().toISOString(),
    status: 'read',
  },

  // Status de entrega: falhou
  delivery_failed: {
    type: 'status',
    id: 'fake_msg_004',
    phone: '+5521999000002',
    timestamp: new Date().toISOString(),
    status: 'failed',
  },

  // Conexao alterada: conectado
  connection_connected: {
    type: 'connection',
    id: 'fake_conn_001',
    phone: '+5521988000001',
    timestamp: new Date().toISOString(),
    connection_status: 'connected',
  },

  // Conexao alterada: desconectado
  connection_disconnected: {
    type: 'connection',
    id: 'fake_conn_002',
    phone: '+5521988000001',
    timestamp: new Date().toISOString(),
    connection_status: 'disconnected',
  },

  // Mensagem de grupo (deve ser ignorada)
  group_message: {
    type: 'message',
    id: 'fake_msg_005',
    phone: '+5521999000003',
    name: 'Grupo Familia',
    timestamp: new Date().toISOString(),
    text: 'Alguem vai no churrasco sabado?',
    is_group: true,
  },

  // Mensagem enviada pela API do Destaka (deve ser ignorada)
  api_sent_message: {
    type: 'echo',
    id: 'fake_msg_006',
    phone: '+5521999000001',
    timestamp: new Date().toISOString(),
    text: 'Template de avaliacao enviado pelo Destaka',
    is_from_api: true,
  },

  // Mensagem com midia (sem texto, deve ser ignorada na deteccao)
  media_message: {
    type: 'message',
    id: 'fake_msg_007',
    phone: '+5521999000004',
    name: 'Carlos Teste',
    timestamp: new Date().toISOString(),
    media_type: 'image',
  },

  // Paciente pede opt-out
  opt_out_keyword: {
    type: 'message',
    id: 'fake_msg_008',
    phone: '+5521999000005',
    name: 'Ana Teste',
    timestamp: new Date().toISOString(),
    text: 'SAIR',
  },

  // Cancelamento de consulta
  cancellation: {
    type: 'message',
    id: 'fake_msg_009',
    phone: '+5521999000001',
    name: 'Maria Teste',
    timestamp: new Date().toISOString(),
    text: 'Oi, preciso desmarcar a consulta de amanha. Tive um imprevisto.',
  },

  // Remarcacao
  reschedule: {
    type: 'echo',
    id: 'fake_msg_010',
    phone: '+5521999000001',
    name: 'Maria Teste',
    timestamp: new Date().toISOString(),
    text: 'Maria, sua consulta foi remarcada para quinta-feira, dia 28/11, no mesmo horario.',
  },
}

// Webhook signing secret para o FakeProvider
const FAKE_WEBHOOK_SECRET = 'fake_webhook_secret_for_testing'

// ============================================================
// FakeProvider
// ============================================================

export class FakeProvider implements WhatsAppReviewProvider {
  readonly name = 'fake'

  // Historico de envios para assertions em testes
  public sentMessages: Array<{
    to: string
    templateName: string
    variables: Record<string, string>
    timestamp: Date
  }> = []

  async createSetupLink(orgId: string): Promise<string> {
    // Retorna URL fake que simula tela de conexao do parceiro
    return `https://fake-partner.example.com/connect?org=${orgId}&provider=fake`
  }

  verifyWebhook(headers: Record<string, string>, body: string): boolean {
    const signature = headers['x-webhook-signature'] ?? headers['X-Webhook-Signature']
    if (!signature) return false

    const expected = crypto
      .createHmac('sha256', FAKE_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    // Comparacao timing-safe
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expected, 'hex')
      )
    } catch {
      return false
    }
  }

  parseEvents(payload: unknown): NormalizedEvent[] {
    const data = payload as FakeWebhookPayload
    if (!data?.events || !Array.isArray(data.events)) return []

    return data.events.map((raw) => this.normalizeEvent(raw))
  }

  async sendTemplate(
    _connection: WhatsAppConnection,
    to: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<SendResult> {
    const messageId = `fake_sent_${crypto.randomUUID()}`

    // Registrar envio no historico
    this.sentMessages.push({
      to,
      templateName,
      variables,
      timestamp: new Date(),
    })

    const masked = to.length > 4
      ? to.slice(0, -4).replace(/\d/g, '*') + to.slice(-4)
      : '****'
    console.log(`[wa-reviews:fake] Template "${templateName}" enviado para ${masked}`)

    return {
      success: true,
      provider_message_id: messageId,
    }
  }

  async getConnectionStatus(connection: WhatsAppConnection): Promise<ConnectionStatus> {
    return {
      connected: connection.status === 'active' || connection.status === 'shadow',
      phone_number_id: connection.phone_number_id,
      display_phone: connection.display_phone,
      last_event_at: connection.last_event_at ? new Date(connection.last_event_at) : null,
    }
  }

  // ============================================================
  // Helpers
  // ============================================================

  private normalizeEvent(raw: FakeRawEvent): NormalizedEvent {
    const base = {
      message_id: raw.id,
      phone: raw.phone,
      contact_name: raw.name ?? null,
      timestamp: new Date(raw.timestamp),
      is_group: raw.is_group ?? false,
      is_from_api: raw.is_from_api ?? false,
      media_type: raw.media_type ?? null,
    }

    switch (raw.type) {
      case 'message':
        return { ...base, type: 'message_received', text: raw.text ?? null }

      case 'echo':
        return { ...base, type: 'echo_sent', text: raw.text ?? null }

      case 'status':
        return {
          ...base,
          type: 'delivery_status',
          text: null,
          delivery_status: raw.status,
        }

      case 'connection':
        return {
          ...base,
          type: 'connection_changed',
          text: null,
          connection_status: raw.connection_status,
        }

      default:
        return { ...base, type: 'message_received', text: null }
    }
  }

  // Helper para testes: gera payload assinado
  static createSignedPayload(events: FakeRawEvent[]): {
    body: string
    headers: Record<string, string>
  } {
    const payload: FakeWebhookPayload = { events }
    const body = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', FAKE_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    return {
      body,
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': signature,
      },
    }
  }

  // Helper: gera payload com assinatura invalida
  static createBadSignaturePayload(events: FakeRawEvent[]): {
    body: string
    headers: Record<string, string>
  } {
    const payload: FakeWebhookPayload = { events }
    const body = JSON.stringify(payload)

    return {
      body,
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': 'invalid_signature_0000000000000000000000000000000000000000000000000000000000000000',
      },
    }
  }
}
