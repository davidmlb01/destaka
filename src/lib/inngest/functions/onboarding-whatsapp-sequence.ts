// Regua de WhatsApp pos-contratacao
// Trigger: destaka/subscription.activated
// Sequencia: dia 0, 3, 7, 14, 30

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { createWhatsAppClient } from '@/lib/whatsapp/client'
import { ONBOARDING_TEMPLATES } from '@/lib/whatsapp/templates'
import type { OnboardingMessageData } from '@/lib/whatsapp/templates'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const DASHBOARD_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.destaka.com.br'

export const onboardingWhatsappSequence = inngest.createFunction(
  {
    id: 'onboarding-whatsapp-sequence',
    cancelOn: [
      {
        event: 'destaka/subscription.cancelled',
        match: 'data.organization_id',
      },
    ],
  },
  { event: 'destaka/subscription.activated' },
  async ({ event, step }) => {
    const orgId = (event as unknown as { data: { organization_id: string } }).data
      .organization_id
    const db = admin()
    const whatsapp = createWhatsAppClient()

    // Busca telefone e nome da organizacao
    const orgData = await step.run('fetch-org-data', async () => {
      const { data: org } = await db
        .from('organizations')
        .select('name, phone')
        .eq('id', orgId)
        .single()

      return org
    })

    // Se nao tem telefone, encerra silenciosamente
    if (!orgData?.phone) {
      return { status: 'skipped', reason: 'telefone nao cadastrado' }
    }

    const dashboardLink = `${DASHBOARD_BASE_URL}/dashboard`
    const results: Array<{ template: string; status: string; error?: string }> = []

    for (const template of ONBOARDING_TEMPLATES) {
      // Aguarda o numero de dias correto entre as mensagens
      if (template.day > 0) {
        const previousDay = ONBOARDING_TEMPLATES[
          ONBOARDING_TEMPLATES.indexOf(template) - 1
        ]?.day ?? 0
        const daysToWait = template.day - previousDay
        await step.sleep(`wait-until-day-${template.day}`, `${daysToWait}d`)
      }

      const result = await step.run(`send-${template.name}`, async () => {
        // Para o template do dia 30, busca scores atualizados
        let messageData: OnboardingMessageData = {
          nome: orgData.name,
          link: dashboardLink,
        }

        if (template.day === 30) {
          const { data: latestScore } = await db
            .from('scores')
            .select('total')
            .eq('organization_id', orgId)
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .single()

          const { data: firstScore } = await db
            .from('scores')
            .select('total')
            .eq('organization_id', orgId)
            .order('snapshot_date', { ascending: true })
            .limit(1)
            .single()

          messageData = {
            ...messageData,
            score_atual: String(latestScore?.total ?? 0),
            score_inicial: String(firstScore?.total ?? 0),
          }
        }

        try {
          const params = template.buildParams(messageData)
          await whatsapp.sendMessage(orgData.phone, template.name, params)
          return { template: template.name, status: 'sent' }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          console.error(
            `[whatsapp-sequence] Falha ao enviar ${template.name} para org ${orgId}:`,
            errorMsg
          )
          return { template: template.name, status: 'error', error: errorMsg }
        }
      })

      results.push(result as { template: string; status: string; error?: string })
    }

    return { organization_id: orgId, messages: results }
  }
)
