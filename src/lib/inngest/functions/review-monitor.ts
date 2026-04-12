// Story 004: Review Management — monitoramento a cada 6h + respostas por IA
// Detecta novos reviews, gera respostas via Claude, publica ou enfileira para aprovação

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { GBPClient } from '@/lib/google/gbp-client'
import { generateReviewResponse, type ReviewTone } from '@/lib/gbp/review-response-engine'

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
  // reviewName = "accounts/{}/locations/{}/reviews/{}"
  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  })
  return res.ok
}

export const reviewMonitor = inngest.createFunction(
  {
    id: 'review-monitor',
    triggers: [{ cron: '0 */6 * * *' }],
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
          .select('name, specialty, tone, automation_preference, gbp_location_id')
          .eq('id', orgId)
          .single()

        if (!org?.gbp_location_id) {
          return { org_id: orgId, new_reviews: 0, responses_queued: 0, error: 'gbp_location_id não configurado' }
        }

        // Busca token
        const { data: tokenRow } = await db
          .from('google_tokens')
          .select('access_token')
          .eq('organization_id', orgId)
          .single()

        if (!tokenRow?.access_token) {
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
        const gbp = new GBPClient(tokenRow.access_token)
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

        for (const review of newReviews) {
          // Salva o review no banco se ainda não existe
          await db.from('reviews').upsert({
            organization_id: orgId,
            review_id: review.reviewId,
            author_name: review.reviewer.isAnonymous ? 'Anônimo' : review.reviewer.displayName,
            rating: GBPClient.starRatingToNumber(review.starRating),
            comment: review.comment ?? null,
            published_at: review.createTime,
          }, { onConflict: 'review_id', ignoreDuplicates: true })

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
              starRating: GBPClient.starRatingToNumber(review.starRating),
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
              tokenRow.access_token,
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
          }

          responsesQueued++
        }

        return {
          org_id: orgId,
          new_reviews: newReviews.length,
          responses_queued: responsesQueued,
        }
      })

      results.push(result as { org_id: string; new_reviews: number; responses_queued: number; error?: string })
    }

    return { processed: results.length, results }
  }
)
