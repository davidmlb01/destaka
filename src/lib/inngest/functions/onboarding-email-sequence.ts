// Regua de email pos-contratacao: 7 emails em 30 dias
// Trigger: evento destaka/subscription.activated
// Usa step.sleep() do Inngest para agendamento

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { sendOnboardingEmail, type OnboardingEmailDay } from '@/lib/email/onboarding'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface SubscriptionActivatedData {
  organization_id: string
  user_email: string
}

const EMAIL_SCHEDULE: Array<{ day: OnboardingEmailDay; sleepDuration: string }> = [
  { day: 0, sleepDuration: '0s' },
  { day: 1, sleepDuration: '1d' },
  { day: 3, sleepDuration: '2d' },
  { day: 7, sleepDuration: '4d' },
  { day: 14, sleepDuration: '7d' },
  { day: 21, sleepDuration: '7d' },
  { day: 30, sleepDuration: '9d' },
]

export const onboardingEmailSequence = inngest.createFunction(
  {
    id: 'onboarding-email-sequence',
    cancelOn: [
      {
        event: 'destaka/subscription.cancelled',
        match: 'data.organization_id',
      },
    ],
  },
  { event: 'destaka/subscription.activated' },
  async ({ event, step }) => {
    const { organization_id, user_email } =
      event.data as SubscriptionActivatedData

    // Busca dados do profissional e organizacao
    const context = await step.run('fetch-context', async () => {
      const db = admin()

      const { data: professional } = await db
        .from('professionals')
        .select('name, email')
        .eq('organization_id', organization_id)
        .eq('role', 'owner')
        .single()

      const { data: org } = await db
        .from('organizations')
        .select('name')
        .eq('id', organization_id)
        .single()

      const email = professional?.email ?? user_email
      const fullName = professional?.name ?? email.split('@')[0]
      const firstName = fullName.split(' ')[0]
      const orgName = org?.name ?? 'Sua clinica'

      return { email, firstName, orgName }
    })

    const results: Array<{ day: OnboardingEmailDay; status: string; error?: string }> = []

    for (const { day, sleepDuration } of EMAIL_SCHEDULE) {
      // Aguarda o tempo entre emails (dia 0 nao tem sleep)
      if (sleepDuration !== '0s') {
        await step.sleep(`wait-for-day-${day}`, sleepDuration)
      }

      const result = await step.run(`send-day-${day}`, async () => {
        try {
          await sendOnboardingEmail({
            to: context.email,
            firstName: context.firstName,
            orgName: context.orgName,
            day,
          })
          return { day, status: 'sent' as const }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(`[onboarding-sequence] Erro dia ${day} org ${organization_id}:`, message)
          return { day, status: 'error' as const, error: message }
        }
      })

      results.push(result)
    }

    return {
      organization_id,
      email: context.email,
      emails_sent: results.filter(r => r.status === 'sent').length,
      emails_failed: results.filter(r => r.status === 'error').length,
      details: results,
    }
  }
)
