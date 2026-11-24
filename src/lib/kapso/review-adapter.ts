// Kapso adapter: implementa WhatsAppReviewProvider para review automation
// Usa a Cloud API da Kapso para envio e recebe webhooks Kapso v2

import crypto from 'crypto'
import { logger } from '@/lib/logger'
import { sendTemplate, verifyWebhookSignature } from './client'
import type { KapsoTemplateComponent } from './client'
import type { WhatsAppConnection } from '@/lib/wa-reviews/db'
import type {
  WhatsAppReviewProvider,
  NormalizedEvent,
  NormalizedEventType,
  SendResult,
  ConnectionStatus,
} from '@/lib/wa-reviews/provider'

// ============================================================
// Kapso webhook payload types (v2)
// ============================================================

interface KapsoWebhookPayload {
  message?: KapsoMessage
  conversation?: KapsoConversation
  phone_number_id?: string
  standby?: { kind: string }
  // Batch
  type?: string
  batch?: boolean
  data?: KapsoWebhookPayload[]
}

interface KapsoMessage {
  id: string
  timestamp: string
  type: string
  from?: string
  to?: string
  text?: { body: string }
  image?: { caption?: string; id?: string }
  audio?: { id?: string }
  kapso: {
    direction: 'inbound' | 'outbound'
    status: string
    processing_status?: string
    origin?: string
    has_media?: boolean
    content?: string
    passive?: boolean
    statuses?: Array<{
      id: string
      status: string
      timestamp: string
      recipient_id?: string
      errors?: Array<{ code: number; title: string; message: string }>
    }>
  }
}

interface KapsoConversation {
  id: string
  contact_name?: string
  phone_number?: string
  status?: string
  phone_number_id?: string
}

// ============================================================
// KapsoReviewProvider
// ============================================================

export class KapsoReviewProvider implements WhatsAppReviewProvider {
  readonly name = 'kapso'

  private webhookSecret: string

  constructor() {
    this.webhookSecret = process.env.KAPSO_WEBHOOK_SECRET ?? ''
  }

  async createSetupLink(orgId: string): Promise<string> {
    // Kapso usa Embedded Signup da Meta para conectar numeros.
    // Na pratica, o profissional conecta via dashboard da Kapso ou
    // via link gerado pelo Multi-tenant API.
    // Por enquanto, retorna link do dashboard.
    return `https://app.kapso.ai/phone-numbers/connect?ref=${orgId}`
  }

  verifyWebhook(headers: Record<string, string>, body: string): boolean {
    const signature = headers['x-webhook-signature'] ?? headers['X-Webhook-Signature']
    if (!signature || !this.webhookSecret) return false
    return verifyWebhookSignature(this.webhookSecret, signature, body)
  }

  parseEvents(payload: unknown): NormalizedEvent[] {
    const data = payload as KapsoWebhookPayload
    if (!data) return []

    // Batch de eventos
    if (data.batch && Array.isArray(data.data)) {
      return data.data.flatMap(item => this.parseSingleEvent(item))
    }

    // Evento unico
    return this.parseSingleEvent(data)
  }

  async sendTemplate(
    connection: WhatsAppConnection,
    to: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<SendResult> {
    const phoneNumberId = connection.phone_number_id
    if (!phoneNumberId) {
      return { success: false, provider_message_id: null, error: 'phone_number_id ausente na conexao' }
    }

    // Montar components no formato Kapso/Meta
    const bodyParams = Object.entries(variables).map(([key, value]) => ({
      type: 'text' as const,
      text: value,
    }))

    const components: KapsoTemplateComponent[] = []

    if (bodyParams.length > 0) {
      components.push({ type: 'body', parameters: bodyParams })
    }

    // Botao "Nao quero receber" (quick_reply, index 1)
    // O template precisa ter esse botao configurado na Meta
    if (templateName.startsWith('pedido_avaliacao')) {
      components.push({
        type: 'button',
        sub_type: 'quick_reply',
        index: '1',
        parameters: [{ type: 'payload', payload: 'opt_out' }],
      })
    }

    const result = await sendTemplate({
      phoneNumberId,
      to,
      templateName,
      language: 'pt_BR',
      components,
    })

    return {
      success: result.success,
      provider_message_id: result.messageId,
      error: result.error,
    }
  }

  async getConnectionStatus(connection: WhatsAppConnection): Promise<ConnectionStatus> {
    // Kapso nao tem endpoint especifico de status de conexao.
    // Usamos o estado local + last_event_at como proxy.
    return {
      connected: connection.status === 'active' || connection.status === 'shadow',
      phone_number_id: connection.phone_number_id,
      display_phone: connection.display_phone,
      last_event_at: connection.last_event_at ? new Date(connection.last_event_at) : null,
    }
  }

  // ============================================================
  // Parser interno
  // ============================================================

  private parseSingleEvent(data: KapsoWebhookPayload): NormalizedEvent[] {
    const events: NormalizedEvent[] = []

    // Standby (mensagem de outro app) - ignorar
    if (data.standby) return events

    // Evento de mensagem
    if (data.message) {
      const msg = data.message
      const conv = data.conversation

      const phone = msg.from ?? msg.to ?? conv?.phone_number ?? ''
      const contactName = conv?.contact_name ?? null
      const timestamp = new Date(parseInt(msg.timestamp) * 1000)
      const messageId = msg.id

      // Texto da mensagem
      let text: string | null = null
      if (msg.text?.body) {
        text = msg.text.body
      } else if (msg.kapso.content) {
        text = msg.kapso.content
      } else if (msg.image?.caption) {
        text = msg.image.caption
      }

      // Determinar tipo de evento
      if (msg.kapso.direction === 'inbound') {
        events.push({
          type: 'message_received',
          message_id: messageId,
          phone,
          contact_name: contactName,
          timestamp,
          text,
          is_group: false, // WhatsApp Cloud API nao suporta grupos em Coexistence
          is_from_api: false,
          media_type: msg.kapso.has_media ? (msg.type !== 'text' ? msg.type : null) : null,
        })
      } else if (msg.kapso.direction === 'outbound') {
        // Checar se e eco do app ou envio da API
        const isFromApi = msg.kapso.origin === 'cloud_api'
        const isFromApp = msg.kapso.origin === 'business_app'

        // Status updates (delivered, read, failed)
        const latestStatus = msg.kapso.statuses?.slice(-1)[0]
        if (latestStatus && latestStatus.status !== 'sent') {
          events.push({
            type: 'delivery_status',
            message_id: messageId,
            phone,
            contact_name: contactName,
            timestamp: new Date(parseInt(latestStatus.timestamp) * 1000),
            text: null,
            delivery_status: latestStatus.status as 'sent' | 'delivered' | 'read' | 'failed',
          })
        }

        // Echo da mensagem (apenas se origin = business_app, para detecao)
        if (isFromApp && msg.kapso.status === 'sent') {
          events.push({
            type: 'echo_sent',
            message_id: messageId,
            phone,
            contact_name: contactName,
            timestamp,
            text,
            is_from_api: false,
          })
        }

        // Mensagem enviada pela API (ignorar na detecao)
        if (isFromApi && msg.kapso.status === 'sent') {
          events.push({
            type: 'echo_sent',
            message_id: messageId,
            phone,
            contact_name: contactName,
            timestamp,
            text,
            is_from_api: true,
          })
        }
      }
    }

    return events
  }
}
