// Automation engine: gera rascunhos de resposta para reviews pendentes
// Chamado pelo cron /api/cron/review-monitor

import { generateReviewReply } from './reviews'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function processReviewQueue(
  db: SupabaseClient,
  profileId: string,
  segment: string,
  businessName: string,
  autoPublish: boolean
): Promise<{ drafted: number; published: number; errors: number }> {
  const result = { drafted: 0, published: 0, errors: 0 }

  // Busca reviews pendentes sem rascunho ainda
  const { data: pending } = await db
    .from('gmb_reviews')
    .select('id, author, rating, text')
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

      if (autoPublish) {
        await db
          .from('gmb_reviews')
          .update({ reply, reply_status: 'replied', ai_reply_draft: null })
          .eq('id', review.id)
        result.published++
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
