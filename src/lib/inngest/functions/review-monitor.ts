// Story 004: Review Management — monitoramento a cada 6h + respostas por IA
// Detecta novos reviews, gera respostas via Claude, publica ou enfileira para aprovação

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { GBPClient } from '@/lib/google/gbp-client'
import { generateReviewResponse, type ReviewTone } from '@/lib/gbp/review-response-engine'
import { hasLgpdConsentForAi } from '@/lib/ai/prompt-sanitizer'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'
import { sendReviewApprovalEmail } from '@/lib/email/review-approval'
import { sendNegativeReviewAlert } from '@/lib/email/review-alert'
import { handleTokenFailure } from '@/lib/alerts/token-alert-helper'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function publishReviewReply(
  accessToken: string,
  reviewName: string,
  comment: string
): Promise<boolean> {
  try {
    const client = new GBPClient(accessToken)
    await client.replyToReview(reviewName, comment)
    return true
  } catch (err) {
    console.error('[review-monitor] Falha ao responder review:', err)
    return false
  }
}

export const reviewMonitor = inngest.createFunction(
  {
    id: 'review-monitor',
    triggers: [
      { cron: '0 */6 * * *' },
      { event: 'destaka/reviews.sync.requested' },
    ],
  },
  async ({ step }) => {
    const db = admin()

    // Todas as orgs com token Google
    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const { data } = await db.from('google_tokens').select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; new_reviews: number; responses_queued: number; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`monitor-reviews-${orgId}`, async () => {
        // Busca configurações da organização
        const { data: org } = await db
          .from('organizations')
          .select('name, specialty, tone, automation_preference, gbp_location_id, lgpd_ai_consent, lgpd_consent_date')
          .eq('id', orgId)
          .single()

        if (!org?.gbp_location_id) {
          return { org_id: orgId, new_reviews: 0, responses_queued: 0, error: 'gbp_location_id não configurado' }
        }

        if (!hasLgpdConsentForAi(org)) {
          return { org_id: orgId, new_reviews: 0, responses_queued: 0, error: 'sem consentimento LGPD para uso de IA' }
        }

        // Busca token com refresh automatico
        const validToken = await getValidTokenForOrg(db, orgId)

        if (!validToken) {
          await handleTokenFailure(orgId)
          return { org_id: orgId, new_reviews: 0, responses_queued: 0, error: 'sem token Google' }
        }

        // Busca city do endereço GBP
        const { data: profile } = await db
          .from('gbp_profiles')
          .select('address')
          .eq('organization_id', orgId)
          .single()

        const address = profile?.address as { locality?: string } | null
        const city = address?.locality ?? 'Brasil'

        // Busca reviews via GBP API
        const gbp = new GBPClient(validToken)
        let reviews: Awaited<ReturnType<GBPClient['listReviews']>> = []
        try {
          reviews = await gbp.listReviews(org.gbp_location_id)
        } catch {
          return { org_id: orgId, new_reviews: 0, responses_queued: 0, error: 'falha ao buscar reviews' }
        }

        // Detecta reviews novos (sem resposta já publicada e sem resposta pendente no banco)
        const { data: existingResponseIds } = await db
          .from('review_responses')
          .select('review_id')
          .eq('organization_id', orgId)
          .in('status', ['pending', 'approved', 'published'])

        const respondedReviewIds = new Set(
          (existingResponseIds ?? []).map((r: { review_id: string }) => r.review_id)
        )

        const newReviews = reviews.filter(r => {
          const hasGbpReply = !!r.reviewReply?.comment
          const hasPendingResponse = respondedReviewIds.has(r.reviewId)
          return !hasGbpReply && !hasPendingResponse
        })

        let responsesQueued = 0
        let alertsSent = 0

        for (const review of newReviews) {
          const rating = GBPClient.starRatingToNumber(review.starRating)
          const authorName = review.reviewer.isAnonymous ? 'Anônimo' : review.reviewer.displayName

          // Salva o review no banco se ainda não existe
          await db.from('reviews').upsert({
            organization_id: orgId,
            review_id: review.reviewId,
            author_name: authorName,
            rating,
            comment: review.comment ?? null,
            published_at: review.createTime,
          }, { onConflict: 'review_id', ignoreDuplicates: false })

          // Reviews negativos (1-3 estrelas): enviar alerta por email, sem gerar resposta IA
          if (rating <= 3) {
            // Verifica se alerta ja foi enviado para este review
            const { data: existingAlert } = await db
              .from('alerts_sent')
              .select('id')
              .eq('organization_id', orgId)
              .eq('alert_type', 'negative_review')
              .eq('reference_id', review.reviewId)
              .limit(1)
              .maybeSingle()

            if (existingAlert) continue

            // Busca email do profissional owner
            const { data: prof } = await db
              .from('professionals')
              .select('email')
              .eq('organization_id', orgId)
              .eq('role', 'owner')
              .maybeSingle()

            if (prof?.email) {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'
              const dashboardUrl = `${appUrl}/dashboard/reviews`

              try {
                await sendNegativeReviewAlert({
                  to: prof.email,
                  orgName: org.name,
                  reviewAuthor: authorName,
                  reviewRating: rating,
                  reviewText: review.comment ?? null,
                  dashboardUrl,
                  specialty: (org.specialty as string) ?? null,
                })

                await db.from('alerts_sent').insert({
                  organization_id: orgId,
                  alert_type: 'negative_review',
                  reference_id: review.reviewId,
                  email_to: prof.email,
                })

                alertsSent++
              } catch {
                console.error(`[review-monitor] Falha ao enviar alerta de review negativo para org ${orgId}`)
              }
            }

            continue
          }

          // Reviews positivos (4-5 estrelas): fluxo normal com resposta IA

          // Busca o UUID do review no banco
          const { data: reviewRow } = await db
            .from('reviews')
            .select('id')
            .eq('review_id', review.reviewId)
            .single()

          if (!reviewRow?.id) continue

          // Gera resposta via Claude
          let responseText = ''
          try {
            responseText = await generateReviewResponse({
              reviewComment: review.comment ?? '',
              starRating: rating,
              professionalName: org.name,
              specialty: org.specialty,
              city,
              tone: org.tone as ReviewTone,
            })
          } catch {
            continue
          }

          if (!responseText) continue

          const isAutomatic = org.automation_preference === 'automatico'

          if (isAutomatic) {
            // Publica direto via GBP API
            const published = await publishReviewReply(
              validToken,
              review.name,
              responseText
            )

            await db.from('review_responses').insert({
              review_id: reviewRow.id,
              organization_id: orgId,
              generated_text: responseText,
              status: published ? 'published' : 'pending',
              published_at: published ? new Date().toISOString() : null,
            })
          } else {
            // Enfileira para aprovação manual
            await db.from('review_responses').insert({
              review_id: reviewRow.id,
              organization_id: orgId,
              generated_text: responseText,
              status: 'pending',
            })

            // Notifica o profissional por email
            const { data: prof } = await db
              .from('professionals')
              .select('email')
              .eq('organization_id', orgId)
              .eq('role', 'owner')
              .maybeSingle()

            if (prof?.email) {
              sendReviewApprovalEmail({
                to: prof.email,
                businessName: org.name,
                reviewAuthor: authorName,
                reviewRating: rating,
                reviewText: review.comment ?? null,
                suggestedReply: responseText,
                specialty: (org.specialty as string) ?? null,
              }).catch(() => {})
            }
          }

          responsesQueued++
        }

        return {
          org_id: orgId,
          new_reviews: newReviews.length,
          responses_queued: responsesQueued,
          alerts_sent: alertsSent,
        }
      })

      results.push(result as { org_id: string; new_reviews: number; responses_queued: number; error?: string })
    }

    return { processed: results.length, results }
  }
)
