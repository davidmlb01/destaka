// Story 004: Review Management — monitoramento a cada 3h + respostas por IA
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
import { listReviews as zernioListReviews, replyToReview as zernioReplyToReview } from '@/lib/zernio/client'

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
      { cron: '0 */3 * * *' },
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

        // Busca Zernio account (se conectado)
        const { data: orgZernio } = await db
          .from('organizations')
          .select('zernio_account_id')
          .eq('id', orgId)
          .maybeSingle()

        // Busca token com refresh automatico
        const validToken = await getValidTokenForOrg(db, orgId)

        if (!validToken && !orgZernio?.zernio_account_id) {
          await handleTokenFailure(orgId)
          return { org_id: orgId, new_reviews: 0, responses_queued: 0, error: 'sem token Google e sem Zernio' }
        }

        // Busca city do endereço GBP
        const { data: profile } = await db
          .from('gbp_profiles')
          .select('address')
          .eq('organization_id', orgId)
          .single()

        const address = profile?.address as { locality?: string } | null
        const city = address?.locality ?? 'Brasil'

        // Busca reviews: Zernio (primario) > GBP API v4 > Places API (fallback)
        let reviews: Awaited<ReturnType<GBPClient['listReviews']>> = []

        // Tenta Zernio primeiro (retorna todas as reviews, paginadas)
        if (orgZernio?.zernio_account_id) {
          try {
            const zReviews = await zernioListReviews(orgZernio.zernio_account_id)
            reviews = zReviews.map(r => ({
              name: `zernio/${r.id}`,
              reviewId: r.id,
              reviewer: { displayName: r.author, isAnonymous: !r.author },
              starRating: (['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const)[Math.min(Math.max(r.rating - 1, 0), 4)],
              comment: r.comment ?? undefined,
              createTime: r.createdAt,
              updateTime: r.createdAt,
              reviewReply: r.reply ? { comment: r.reply, updateTime: r.createdAt } : undefined,
            }))
          } catch (err) {
            console.log('[review-monitor] Zernio listReviews falhou, tentando fallback:', err)
          }
        }

        // Fallback: GBP API v4 + Places API para orgs sem Zernio ou quando Zernio falha
        if (reviews.length === 0 && validToken) {
          const gbp = new GBPClient(validToken)
          try {
            reviews = await gbp.listReviews(org.gbp_location_id)
          } catch {
            // GBP v4 falhou, ignora
          }

          // Se GBP v4 retornou vazio, usa Places API como fallback
          if (reviews.length === 0) {
            // google_place_id esta em gmb_profiles (tabela antiga)
            const { data: prof } = await db
              .from('professionals')
              .select('user_id')
              .eq('organization_id', orgId)
              .maybeSingle()

            if (!prof?.user_id) {
              console.log(`[review-monitor] Sem profissional vinculado à org ${orgId}, Places API fallback indisponível`)
            } else {
              const { data: gmbProfile } = await db
                .from('gmb_profiles')
                .select('google_place_id')
                .eq('user_id', prof.user_id)
                .maybeSingle()

              const placeId = (gmbProfile as { google_place_id?: string } | null)?.google_place_id
              if (placeId) {
                reviews = await GBPClient.listReviewsViaPlaces(placeId)
              }
            }
          }
        }

        if (reviews.length === 0) {
          return { org_id: orgId, new_reviews: 0, responses_queued: 0, error: 'sem reviews encontradas (Zernio + GBP + Places)' }
        }

        // Detecta reviews novos (sem resposta já publicada e sem resposta pendente no banco)
        // Passo 1: busca UUIDs de reviews que já têm resposta na tabela review_responses
        const { data: existingResponseIds } = await db
          .from('review_responses')
          .select('review_id')
          .eq('organization_id', orgId)
          .in('status', ['pending', 'published'])

        const respondedReviewUuids = (existingResponseIds ?? []).map((r: { review_id: string }) => r.review_id)

        // Passo 2: busca os Google review_ids (string) correspondentes a esses UUIDs
        // review_responses.review_id é FK para reviews.id (UUID), não para o Google review_id (string)
        // A comparação deve ser feita com r.reviewId (Google ID), não com o UUID
        let respondedReviewIds = new Set<string>()
        if (respondedReviewUuids.length > 0) {
          const { data: reviewsWithResponses } = await db
            .from('reviews')
            .select('review_id')
            .in('id', respondedReviewUuids)

          respondedReviewIds = new Set(
            (reviewsWithResponses ?? []).map((r: { review_id: string }) => r.review_id)
          )
        }

        // Para modo manual: NÃO pular reviews que têm reply no Google.
        // O usuário precisa ver todas as reviews na UI, mesmo as já respondidas externamente.
        // Para modo automático: pular reviews que já têm reply no Google (já publicadas).
        const isManualMode = org.automation_preference !== 'automatico'

        // Limite: só processa reviews dos últimos 30 dias (evita inundar com histórico)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

        const newReviews = reviews.filter(r => {
          const hasGbpReply = !!r.reviewReply?.comment
          const hasPendingResponse = respondedReviewIds.has(r.reviewId)
          // Modo manual: gera resposta mesmo se já tem reply no Google (usuário quer ver e aprovar)
          // Modo automático: pula reviews que já tem reply no Google
          if (hasPendingResponse) return false
          if (hasGbpReply && !isManualMode) return false
          // Só processa reviews recentes (30 dias)
          if (r.createTime && r.createTime < thirtyDaysAgo) return false
          return true
        })

        // Batch load reviews existentes para dedup cross-source em memória
        const { data: existingOrgReviews } = await db
          .from('reviews')
          .select('review_id, author_name, rating, published_at')
          .eq('organization_id', orgId)

        const existingReviewSet = new Set(
          (existingOrgReviews ?? []).map((r: { author_name: string; rating: number; published_at: string }) =>
            `${r.author_name}|${r.rating}|${r.published_at?.substring(0, 10) ?? ''}`
          )
        )

        let responsesQueued = 0
        let alertsSent = 0
        let generationsFailed = 0

        for (const review of newReviews) {
          const rating = GBPClient.starRatingToNumber(review.starRating)
          const authorName = review.reviewer.isAnonymous ? 'Anônimo' : review.reviewer.displayName

          // Dedup cross-source em memória (evita N+1 queries)
          const publishedDate = review.createTime ? review.createTime.substring(0, 10) : null
          const dedupKey = `${authorName}|${rating}|${publishedDate ?? ''}`
          // Verifica se existe outro review (diferente deste) com mesmo autor+rating+data
          const existsInDb = existingReviewSet.has(dedupKey)
          // Se já existe no DB E o review_id atual não está no DB, é duplicata cross-source
          const currentExists = (existingOrgReviews ?? []).some(
            (r: { review_id: string }) => r.review_id === review.reviewId
          )
          if (existsInDb && !currentExists) {
            console.log(`[review-monitor] Review duplicado cross-source: ${authorName} (${review.reviewId}). Pulando.`)
            continue
          }

          // Salva o review no banco se ainda não existe
          await db.from('reviews').upsert({
            organization_id: orgId,
            review_id: review.reviewId,
            author_name: authorName,
            rating,
            comment: review.comment ?? null,
            published_at: review.createTime,
          }, { onConflict: 'review_id', ignoreDuplicates: true })

          // Reviews negativos (abaixo de 4 estrelas): enviar alerta por email, sem gerar resposta IA
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
              } catch (alertErr) {
                console.error(`[review-monitor] Falha ao enviar alerta de review negativo: org=${orgId}, review=${review.reviewId}`, alertErr)
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
              reviewerName: review.reviewer?.displayName ?? '',
              specialty: org.specialty,
              city,
              tone: (org.tone as ReviewTone) ?? 'proximo',
            })
          } catch (err) {
            console.error(`[review-monitor] Falha ao gerar resposta IA: org=${orgId}, review=${review.reviewId}`, err)
            generationsFailed++
            continue
          }

          if (!responseText) continue

          const isAutomatic = org.automation_preference === 'automatico'

          if (isAutomatic) {
            let published = false

            // Tenta Zernio primeiro
            if (orgZernio?.zernio_account_id) {
              published = await zernioReplyToReview(orgZernio.zernio_account_id, review.reviewId, responseText)
            }

            // Fallback para GBP v4
            if (!published && validToken) {
              published = await publishReviewReply(validToken, review.name, responseText)
            }

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
              try {
                await sendReviewApprovalEmail({
                  to: prof.email,
                  businessName: org.name,
                  reviewAuthor: authorName,
                  reviewRating: rating,
                  reviewText: review.comment ?? null,
                  suggestedReply: responseText,
                  specialty: (org.specialty as string) ?? null,
                })
              } catch (emailErr) {
                console.error(`[review-monitor] Falha ao enviar email de aprovação: org=${orgId}, review=${review.reviewId}`, emailErr)
              }
            }
          }

          responsesQueued++
        }

        return {
          org_id: orgId,
          new_reviews: newReviews.length,
          responses_queued: responsesQueued,
          alerts_sent: alertsSent,
          generations_failed: generationsFailed,
        }
      })

      results.push(result as { org_id: string; new_reviews: number; responses_queued: number; error?: string })
    }

    return { processed: results.length, results }
  }
)
