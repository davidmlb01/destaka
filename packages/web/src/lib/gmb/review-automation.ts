// Automation engine: gera rascunhos de resposta para reviews pendentes
// Chamado pelo cron /api/cron/review-monitor

import { generateReviewReply } from './reviews'
import { replyToReview } from './client'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function processReviewQueue(
  db: SupabaseClient,
  profileId: string,
  segment: string,
  businessName: string,
  autoPublish: boolean,
  accessToken: string | null = null
): Promise<{ drafted: number; published: number; errors: number }> {
  const result = { drafted: 0, published: 0, errors: 0 }

  // Busca reviews pendentes sem rascunho ainda — inclui google_review_id para reply via API
  const { data: pending } = await db
    .from('gmb_reviews')
    .select('id, author, rating, text, google_review_id')
    .eq('profile_id', profileId)
    .eq('reply_status', 'pending')
    .is('ai_reply_draft', null)
    .limit(10)

  if (!pending?.length) return result

  for (const review of pending) {
    try {
      const reply = await generateReviewReply(
        { author: review.author, rating: review.rating, text: review.text },
        segment,
        businessName
      )

      if (autoPublish && accessToken) {
        try {
          // Publica resposta na GBP API — google_review_id deve ser o nome completo
          // ex: "accounts/{id}/locations/{id}/reviews/{id}"
          await replyToReview(accessToken, review.google_review_id, reply)
          await db
            .from('gmb_reviews')
            .update({ reply, reply_status: 'replied', ai_reply_draft: null })
            .eq('id', review.id)
          result.published++
        } catch (gbpErr) {
          // API falhou — salva como rascunho para publicação manual
          console.warn(`[review-automation] falha ao publicar resposta na GBP review=${review.id}:`, gbpErr)
          await db
            .from('gmb_reviews')
            .update({ ai_reply_draft: reply })
            .eq('id', review.id)
          result.drafted++
        }
      } else {
        await db
          .from('gmb_reviews')
          .update({ ai_reply_draft: reply })
          .eq('id', review.id)
        result.drafted++
      }
    } catch (err) {
      console.error(`[review-automation] error review=${review.id}:`, err)
      result.errors++
    }
  }

  return result
}
