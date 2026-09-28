// Funcao de envio dos emails de onboarding pos-contratacao
// Usa templates de onboarding-templates.ts + Resend via email/index.ts

import { resend, FROM } from './index'
import {
  templateDay0,
  templateDay1,
  templateDay3,
  templateDay7,
  templateDay14,
  templateDay21,
  templateDay30,
} from './onboarding-templates'

export type OnboardingEmailDay = 0 | 1 | 3 | 7 | 14 | 21 | 30

interface SendOnboardingEmailParams {
  to: string
  firstName: string
  orgName: string
  day: OnboardingEmailDay
}

const templateMap: Record<OnboardingEmailDay, (firstName: string, orgName: string) => { subject: string; html: string }> = {
  0: (firstName) => templateDay0(firstName),
  1: (firstName) => templateDay1(firstName),
  3: (firstName) => templateDay3(firstName),
  7: (firstName, orgName) => templateDay7(firstName, orgName),
  14: (firstName) => templateDay14(firstName),
  21: (firstName) => templateDay21(firstName),
  30: (firstName, orgName) => templateDay30(firstName, orgName),
}

export async function sendOnboardingEmail(params: SendOnboardingEmailParams) {
  const { to, firstName, orgName, day } = params
  const buildTemplate = templateMap[day]

  if (!buildTemplate) {
    throw new Error(`Template de onboarding nao encontrado para dia ${day}`)
  }

  const { subject, html } = buildTemplate(firstName, orgName)

  const { data, error } = await resend.emails.send({
    from: `Destaka <${FROM}>`,
    to,
    subject,
    html,
  })

  if (error) {
    console.error(`[onboarding-email] Falha ao enviar email dia ${day} para ${to}:`, error.message)
    throw new Error(`Falha ao enviar email de onboarding dia ${day}: ${error.message}`)
  }

  return { messageId: data?.id, day }
}
