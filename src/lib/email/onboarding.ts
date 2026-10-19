// Funcao de envio dos emails de onboarding pos-contratacao
// Usa templates de onboarding-templates.ts + Resend via email/index.ts

import { resend, FROM } from './index'
import { getBrandName } from '@/lib/vertical-vocab'
import {
  templateDay0,
  templateDay1,
  templateDay3,
  templateDay7,
  templateDay14,
  templateDay30,
} from './onboarding-templates'

export type OnboardingEmailDay = 0 | 1 | 3 | 7 | 14 | 30

interface SendOnboardingEmailParams {
  to: string
  firstName: string
  orgName: string
  day: OnboardingEmailDay
  gender?: 'M' | 'F'
  specialty?: string | null
  initialScore?: number
  postsCount?: number
  scoreDelta?: number
  day30Data?: {
    scoreInitial: number
    scoreCurrent: number
    postsCount: number
    reviewsCount: number
    profileViews?: number
    websiteClicks?: number
    phoneClicks?: number
    whatsappClicks?: number
  }
}

export async function sendOnboardingEmail(params: SendOnboardingEmailParams) {
  const { to, firstName, orgName, day, specialty } = params

  let template: { subject: string; html: string }

  switch (day) {
    case 0:
      template = templateDay0(firstName, params.gender, specialty)
      break
    case 1:
      template = templateDay1(firstName, orgName, params.initialScore ?? 0, specialty)
      break
    case 3:
      template = templateDay3(firstName, specialty)
      break
    case 7:
      template = templateDay7(firstName, orgName, params.postsCount ?? 0, params.scoreDelta ?? 0, specialty)
      break
    case 14:
      template = templateDay14(firstName, specialty)
      break
    case 30:
      template = templateDay30({
        firstName,
        orgName,
        scoreInitial: params.day30Data?.scoreInitial ?? 0,
        scoreCurrent: params.day30Data?.scoreCurrent ?? 0,
        postsCount: params.day30Data?.postsCount ?? 0,
        reviewsCount: params.day30Data?.reviewsCount ?? 0,
        profileViews: params.day30Data?.profileViews,
        websiteClicks: params.day30Data?.websiteClicks,
        phoneClicks: params.day30Data?.phoneClicks,
        whatsappClicks: params.day30Data?.whatsappClicks,
        specialty,
      })
      break
    default:
      throw new Error(`Template de onboarding nao encontrado para dia ${day}`)
  }

  const brand = getBrandName(specialty)
  const { data, error } = await resend.emails.send({
    from: `${brand} <${FROM}>`,
    to,
    subject: template.subject,
    html: template.html,
  })

  if (error) {
    console.error(`[onboarding-email] Falha ao enviar email dia ${day} para ${to}:`, error.message)
    throw new Error(`Falha ao enviar email de onboarding dia ${day}: ${error.message}`)
  }

  return { messageId: data?.id, day }
}
