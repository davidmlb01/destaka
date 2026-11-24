// Kapso adapter: implementa WhatsAppClient para envio de onboarding
// Substitui Twilio/Gupshup no src/lib/whatsapp/client.ts

import { sendDestakaTemplate } from './client'
import type { KapsoTemplateComponent } from './client'
import type { WhatsAppClient } from '@/lib/whatsapp/client'

export class KapsoWhatsAppClient implements WhatsAppClient {
  async sendMessage(
    phone: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<void> {
    // Converter params {1: "Maria", 2: "link"} para components format
    const bodyParams = Object.values(params).map(value => ({
      type: 'text' as const,
      text: value,
    }))

    const components: KapsoTemplateComponent[] = bodyParams.length > 0
      ? [{ type: 'body', parameters: bodyParams }]
      : []

    const result = await sendDestakaTemplate(
      phone,
      templateName,
      'pt_BR',
      components
    )

    if (!result.success) {
      throw new Error(`[whatsapp:kapso] Falha ao enviar: ${result.error}`)
    }

    const masked = phone.length > 4
      ? phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4)
      : '****'
    console.log(`[whatsapp:kapso] Template "${templateName}" enviado para ${masked}`)
  }
}
