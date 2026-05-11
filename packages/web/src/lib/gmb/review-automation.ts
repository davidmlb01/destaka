// Automation engine: gera rascunhos de resposta para reviews pendentes
// Chamado pelo cron /api/cron/review-monitor

import { generateReviewReply } from './reviews'
import { replyToReview } from './client'
import { sendReviewApprovalEmail } from '@/lib/email/review-approval'
import { logger } from '@/lib/logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Palavras sensíveis para compliance na área de saúde
// Reviews que mencionem procedimentos/tratamentos exigem aprovação humana
// ---------------------------------------------------------------------------

const HEALTH_SENSITIVE_WORDS = [
  'tratamento', 'cirurgia', 'implante', 'canal', 'prótese',
  'diagnóstico', 'diagnostico', 'exame', 'medicamento', 'receita',
  'procedimento', 'anestesia', 'extração', 'extracao', 'raio-x',
  'radiografia', 'tomografia', 'ressonância', 'ressonancia',
  'prescrição', 'prescricao', 'biopsia', 'biópsia', 'sutura',
  'internação', 'internacao', 'sedação', 'sedacao',
]

// ---------------------------------------------------------------------------
// Classificação de severidade: define se publica direto ou exige aprovação
// ---------------------------------------------------------------------------

export type ReviewSeverity = 'auto' | 'approval'

export function getReviewSeverity(rating: number, text: string | null): ReviewSeverity {
  // Qualquer review que mencione procedimento/tratamento: aprovação obrigatória
  if (text) {
    const lower = text.toLowerCase()
    for (const word of HEALTH_SENSITIVE_WORDS) {
      if (lower.includes(word)) return 'approval'
    }
  }

  // 1-2 estrelas: risco alto, aprovação obrigatória
  if (rating <= 2) return 'approval'

  // 3 estrelas: risco médio, aprovação obrigatória
  if (rating === 3) return 'approval'

  // 4-5 estrelas sem texto: baixo risco, publicação automática
  // 4-5 estrelas com elogio (sem palavras sensíveis): publicação automática
  return 'auto'
}

// ---------------------------------------------------------------------------
// Processamento da fila de reviews
// ---------------------------------------------------------------------------

export async function processReviewQueue(
  db: SupabaseClient,
  profileId: string,
  segment: string,
  businessName: string,
  autoPublish: boolean,
  accessToken: string | null = null,
  userEmail: string | null = null
): Promise<{ drafted: number; published: number; pendingApproval: number; errors: number }> {
  const result = { drafted: 0, published: 0, pendingApproval: 0, errors: 0 }

  // Busca reviews pendentes sem rascunho ainda
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

      const severity = getReviewSeverity(review.rating, review.text)

      if (severity === 'approval') {
        // Salva como rascunho pendente de aprovação, NÃO publica
        await db
          .from('gmb_reviews')
          .update({
            ai_reply_draft: reply,
            reply_status: 'pending_approval',
          })
          .eq('id', review.id)
        result.pendingApproval++

        // Notifica o profissional por email
        if (userEmail) {
          try {
            await sendReviewApprovalEmail({
              to: userEmail,
              businessName,
              reviewAuthor: review.author,
              reviewRating: review.rating,
              reviewText: review.text,
              suggestedReply: reply,
            })
          } catch (emailErr) {
            logger.warn('review-automation', 'falha ao enviar email de aprovação', {
              reviewId: review.id,
              err: String(emailErr),
            })
          }
        }
      } else if (autoPublish && accessToken) {
        try {
          // Publica resposta na GBP API
          await replyToReview(accessToken, review.google_review_id, reply)
          await db
            .from('gmb_reviews')
            .update({ reply, reply_status: 'auto_published', ai_reply_draft: null })
            .eq('id', review.id)
          result.published++
        } catch (gbpErr) {
          // API falhou: salva como rascunho para publicação manual
          logger.warn('review-automation', 'falha ao publicar resposta na GBP', {
            reviewId: review.id,
            err: String(gbpErr),
          })
          try {
            await db
              .from('gmb_reviews')
              .update({ ai_reply_draft: reply })
              .eq('id', review.id)
            result.drafted++
          } catch (dbErr) {
            logger.error('review-automation', 'falha ao salvar draft', {
              reviewId: review.id,
              err: String(dbErr),
            })
            result.errors++
          }
        }
      } else {
        await db
          .from('gmb_reviews')
          .update({ ai_reply_draft: reply })
          .eq('id', review.id)
        result.drafted++
      }
    } catch (err) {
      logger.error('review-automation', 'erro ao processar review', {
        reviewId: review.id,
        err: String(err),
      })
      result.errors++
    }
  }

  return result
}
