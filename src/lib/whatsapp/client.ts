// Modulo de envio WhatsApp Business API
// Provider configuravel via env WHATSAPP_PROVIDER (stub | twilio | gupshup)

export interface WhatsAppClient {
  sendMessage(
    phone: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<void>
}

// --- Stub provider (loga e retorna sucesso) ---

class StubWhatsAppClient implements WhatsAppClient {
  async sendMessage(
    phone: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<void> {
    console.log(
      `[whatsapp:stub] Enviaria template "${templateName}" para ${phone}`,
      JSON.stringify(params)
    )
  }
}

// --- Twilio provider ---

class TwilioWhatsAppClient implements WhatsAppClient {
  private accountSid: string
  private authToken: string
  private fromNumber: string

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID ?? ''
    this.authToken = process.env.TWILIO_AUTH_TOKEN ?? ''
    this.fromNumber = process.env.TWILIO_WHATSAPP_FROM ?? ''

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error(
        '[whatsapp:twilio] Variaveis TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM sao obrigatorias'
      )
    }
  }

  async sendMessage(
    phone: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`

    const body = new URLSearchParams({
      From: `whatsapp:${this.fromNumber}`,
      To: `whatsapp:${phone}`,
      ContentSid: templateName,
      ContentVariables: JSON.stringify(params),
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`[whatsapp:twilio] Falha ao enviar: ${res.status} ${error}`)
    }

    console.log(`[whatsapp:twilio] Template "${templateName}" enviado para ${phone}`)
  }
}

// --- Gupshup provider ---

class GupshupWhatsAppClient implements WhatsAppClient {
  private apiKey: string
  private appName: string
  private sourceNumber: string

  constructor() {
    this.apiKey = process.env.GUPSHUP_API_KEY ?? ''
    this.appName = process.env.GUPSHUP_APP_NAME ?? ''
    this.sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER ?? ''

    if (!this.apiKey || !this.appName || !this.sourceNumber) {
      throw new Error(
        '[whatsapp:gupshup] Variaveis GUPSHUP_API_KEY, GUPSHUP_APP_NAME e GUPSHUP_SOURCE_NUMBER sao obrigatorias'
      )
    }
  }

  async sendMessage(
    phone: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<void> {
    const url = 'https://api.gupshup.io/wa/api/v1/template/msg'

    const body = new URLSearchParams({
      channel: 'whatsapp',
      source: this.sourceNumber,
      destination: phone,
      'template': JSON.stringify({
        id: templateName,
        params: Object.values(params),
      }),
      src_name: this.appName,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`[whatsapp:gupshup] Falha ao enviar: ${res.status} ${error}`)
    }

    console.log(`[whatsapp:gupshup] Template "${templateName}" enviado para ${phone}`)
  }
}

// --- Factory ---

export type WhatsAppProvider = 'stub' | 'twilio' | 'gupshup'

export function createWhatsAppClient(): WhatsAppClient {
  const provider = (process.env.WHATSAPP_PROVIDER ?? 'stub') as WhatsAppProvider

  switch (provider) {
    case 'twilio':
      return new TwilioWhatsAppClient()
    case 'gupshup':
      return new GupshupWhatsAppClient()
    case 'stub':
    default:
      return new StubWhatsAppClient()
  }
}
