// WhatsApp Review Automation: Inngest function de envio
// Roda a cada 15 minutos, busca requests agendados e envia.
// Tambem pode ser disparada por evento para envio imediato.

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { logger } from '@/lib/logger'
import {
  getScheduledRequestsDue,
  getSettings,
  getConnection,
  getContactById,
  updateReviewRequestStatus,
  skipReviewRequest,
  decryptPhone,
} from '@/lib/wa-reviews/db'
import { checkSendGuards, buildReviewLink, buildTemplateVariables } from '@/lib/wa-reviews/scheduler'
import { createReviewProvider } from '@/lib/wa-reviews/provider'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const waReviewSender = inngest.createFunction(
  {
    id: 'wa-review-sender',
    triggers: [
      { cron: '*/15 * * * *' }, // A cada 15 minutos
      { event: 'destaka/wa-review.send.requested' },
    ],
    concurrency: [{ limit: 1 }], // Nunca rodar em paralelo
  },
  async ({ event, step }) => {
    const db = admin()
    const provider = createReviewProvider()
    const now = new Date()

    // Buscar todas as orgs com conexao ativa
    const orgIds: string[] = await step.run('list-active-orgs', async () => {
      const { data } = await db
        .from('whatsapp_connections')
        .select('organization_id')
        .in('status', ['active', 'shadow'])
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    let totalSent = 0
    let totalSkipped = 0
    let totalFailed = 0

    for (const orgId of orgIds) {
      const orgResult = await step.run(`process-org-${orgId}`, async () => {
        let sent = 0
        let skipped = 0
        let failed = 0

        // Buscar requests agendados que ja passaram do horario
        const requests = await getScheduledRequestsDue(orgId, now)

        for (const request of requests) {
          // Checar todas as guardas
          const guards = await checkSendGuards(orgId, request)

          if (!guards.can_send) {
            await skipReviewRequest(orgId, request.id, guards.skip_reason!)
            skipped++
            continue
          }

          // Buscar dados para o template
          const connection = await getConnection(orgId)
          if (!connection) {
            await skipReviewRequest(orgId, request.id, 'disconnected')
            skipped++
            continue
          }

          const contact = await getContactById(orgId, request.contact_id)
          if (!contact) {
            await skipReviewRequest(orgId, request.id, 'contact_not_found')
            skipped++
            continue
          }

          const settings = await getSettings(orgId)

          // Buscar nome da org
          const { data: org } = await db
            .from('organizations')
            .select('name, google_place_id')
            .eq('id', orgId)
            .maybeSingle()

          if (!org?.google_place_id) {
            await skipReviewRequest(orgId, request.id, 'no_review_link')
            skipped++
            continue
          }

          // Link de review com redirect para tracking
          const reviewLink = settings.google_review_url ??
            buildReviewLink(request.id)

          const { template, variables } = buildTemplateVariables(
            contact.display_name,
            org.name ?? 'nossa clinica',
            reviewLink
          )

          // Descriptografar telefone para envio
          const phone = decryptPhone(contact)

          // Enviar template
          const sendResult = await provider.sendTemplate(
            connection,
            phone,
            template,
            variables
          )

          if (sendResult.success) {
            await updateReviewRequestStatus(orgId, request.id, {
              status: 'sent',
              provider_message_id: sendResult.provider_message_id,
              template_name: template,
              sent_at: new Date().toISOString(),
              cost_estimate_brl: estimateCost(),
            })
            sent++
          } else {
            await updateReviewRequestStatus(orgId, request.id, {
              status: 'failed',
            })
            logger.error('wa-review-sender', `Envio falhou: ${sendResult.error}`, { orgId })
            failed++
          }
        }

        return { sent, skipped, failed }
      })

      totalSent += orgResult.sent
      totalSkipped += orgResult.skipped
      totalFailed += orgResult.failed
    }

    return {
      orgs_processed: orgIds.length,
      sent: totalSent,
      skipped: totalSkipped,
      failed: totalFailed,
    }
  }
)

// Estimativa de custo por mensagem (atualizar com valor real do parceiro)
function estimateCost(): number {
  // Template utilidade: R$ 0,035
  // Template marketing: R$ 0,3217
  // Usar marketing como pior caso ate saber a categoria
  return 0.3217
}
