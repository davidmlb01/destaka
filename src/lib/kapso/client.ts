// Kapso WhatsApp Cloud API: client wrapper
// SDK: @kapso/whatsapp-cloud-api (ou fetch direto)
// Docs: https://docs.kapso.ai/api/introduction

import { logger } from '@/lib/logger'

const BASE_URL = 'https://api.kapso.ai/meta/whatsapp/v24.0'
const PLATFORM_URL = 'https://api.kapso.ai/platform/v1'

function getApiKey(): string {
  const key = process.env.KAPSO_API_KEY
  if (!key) throw new Error('[kapso] KAPSO_API_KEY nao configurada')
  return key
}

function getDestakaPhoneId(): string {
  const id = process.env.KAPSO_DESTAKA_PHONE_ID
  if (!id) throw new Error('[kapso] KAPSO_DESTAKA_PHONE_ID nao configurado')
  return id
}

// ============================================================
// Envio de mensagens
// ============================================================

export interface KapsoSendTemplateParams {
  phoneNumberId: string
  to: string
  templateName: string
  language: string
  components?: KapsoTemplateComponent[]
}

export interface KapsoTemplateComponent {
  type: 'body' | 'header' | 'button'
  sub_type?: 'quick_reply' | 'url'
  index?: string
  parameters: Array<{
    type: 'text' | 'payload' | 'image'
    text?: string
    payload?: string
    image?: { link: string }
  }>
}

export interface KapsoSendResult {
  success: boolean
  messageId: string | null
  error?: string
}

export async function sendTemplate(params: KapsoSendTemplateParams): Promise<KapsoSendResult> {
  const url = `${BASE_URL}/${params.phoneNumberId}/messages`

  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: params.to,
    type: 'template',
    template: {
      name: params.templateName,
      language: { code: params.language },
      ...(params.components ? { components: params.components } : {}),
    },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorText = await res.text()
      logger.error('kapso', `Envio falhou: ${res.status}`, { phoneNumberId: params.phoneNumberId })
      return { success: false, messageId: null, error: `${res.status}: ${errorText}` }
    }

    const data = await res.json()
    const messageId = data?.messages?.[0]?.id ?? null

    return { success: true, messageId }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    logger.error('kapso', `Erro de rede: ${msg}`)
    return { success: false, messageId: null, error: msg }
  }
}

// ============================================================
// Envio simples (para onboarding, usando numero do Destaka)
// ============================================================

export async function sendDestakaTemplate(
  to: string,
  templateName: string,
  language: string,
  components?: KapsoTemplateComponent[]
): Promise<KapsoSendResult> {
  return sendTemplate({
    phoneNumberId: getDestakaPhoneId(),
    to,
    templateName,
    language,
    components,
  })
}

// ============================================================
// Webhook management (Platform API)
// ============================================================

export interface KapsoWebhookConfig {
  url: string
  secret: string
  events?: string[]
}

export async function createWebhook(
  phoneNumberId: string,
  config: KapsoWebhookConfig
): Promise<{ id: string }> {
  const url = `${PLATFORM_URL}/whatsapp/phone_numbers/${phoneNumberId}/webhooks`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getApiKey(),
    },
    body: JSON.stringify({
      url: config.url,
      secret: config.secret,
      events: config.events ?? ['whatsapp.message.received'],
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`[kapso] createWebhook falhou: ${res.status} ${errorText}`)
  }

  const data = await res.json()
  return { id: data?.data?.id ?? data?.id }
}

// ============================================================
// Webhook signature verification
// ============================================================

import crypto from 'crypto'

export function verifyWebhookSignature(
  secret: string,
  signature: string,
  rawBody: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}
