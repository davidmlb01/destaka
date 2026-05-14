// =============================================================================
// DESTAKA — Review Service
// Story 1.6 — Gestão de Avaliações
// =============================================================================

import { getAnthropic, AI_MODEL_FAST } from '@/lib/ai'
import { listGmbReviews } from './client'
import { sanitizeForPrompt } from '@/lib/sanitize'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Review {
  id: string
  profile_id: string
  google_review_id: string
  author: string
  rating: number
  text: string | null
  reply: string | null
  ai_reply_draft: string | null
  reply_status: 'pending' | 'replied' | 'ignored' | 'auto_published' | 'pending_approval' | 'approved' | 'rejected'
  review_date: string
  created_at: string
}

export type ReviewFilter = 'all' | 'pending' | 'negative' | 'pending_approval'

// ---------------------------------------------------------------------------
// Mock reviews (usados em dev enquanto API não está aprovada)
// ---------------------------------------------------------------------------

export const MOCK_REVIEWS: Omit<Review, 'id' | 'profile_id' | 'created_at'>[] = [
  {
    google_review_id: 'mock-1',
    author: 'Ana Paula Souza',
    rating: 5,
    text: 'Excelente atendimento! A equipe foi muito atenciosa e o procedimento foi rápido e indolor. Com certeza voltarei.',
    reply: null,
    reply_status: 'pending',
    ai_reply_draft: null,
    review_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    google_review_id: 'mock-2',
    author: 'Carlos Mendes',
    rating: 5,
    text: 'Profissional excelente, muito cuidadoso e explica tudo com calma. Recomendo demais!',
    reply: 'Obrigado pela avaliação, Carlos! Fico feliz que tenha gostado do atendimento. Até a próxima consulta!',
    reply_status: 'replied',
    ai_reply_draft: null,
    review_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    google_review_id: 'mock-3',
    author: 'Fernanda Lima',
    rating: 2,
    text: 'Esperei mais de 1 hora além do horário marcado sem nenhuma explicação. O atendimento em si foi ok, mas a organização precisa melhorar.',
    reply: null,
    reply_status: 'pending',
    ai_reply_draft: null,
    review_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    google_review_id: 'mock-4',
    author: 'Roberto Alves',
    rating: 4,
    text: 'Bom atendimento e ambiente agradável. Só achei um pouco caro comparado a outros locais.',
    reply: null,
    reply_status: 'pending',
    ai_reply_draft: null,
    review_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    google_review_id: 'mock-5',
    author: 'Juliana Costa',
    rating: 1,
    text: 'Péssima experiência. Fui marcada para às 14h e só fui atendida às 16h. Não retornarei.',
    reply: null,
    reply_status: 'pending',
    ai_reply_draft: null,
    review_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    google_review_id: 'mock-6',
    author: 'Marcos Oliveira',
    rating: 5,
    text: 'Melhor clínica que já fui! Equipe super atenciosa e instalações modernas. Recomendo.',
    reply: 'Muito obrigado, Marcos! Sua satisfação é o que nos motiva. Conte conosco sempre!',
    reply_status: 'replied',
    ai_reply_draft: null,
    review_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ---------------------------------------------------------------------------
// Gerar resposta via Claude
// ---------------------------------------------------------------------------

export async function generateReviewReply(
  review: Pick<Review, 'author' | 'rating' | 'text'>,
  segment: string,
  businessName: string
): Promise<string> {
  const tone = review.rating <= 2
    ? 'empático e não defensivo, reconheça o problema e convide para contato direto'
    : review.rating === 3
    ? 'agradecido e construtivo, mostre que o feedback foi recebido'
    : 'caloroso e agradecido, personalize para o comentário específico'

  const safeName = sanitizeForPrompt(businessName)
  const safeAuthor = sanitizeForPrompt(review.author, 80)
  const safeText = sanitizeForPrompt(review.text, 500)

  const message = await getAnthropic().messages.create({
    model: AI_MODEL_FAST,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Você é o(a) responsável por ${safeName}, um(a) ${segment} brasileiro(a).

Escreva uma resposta para esta avaliação do Google:

Autor: ${safeAuthor}
Nota: ${review.rating}/5
Texto: "${safeText || '(sem comentário)'}"

Tom: ${tone}
Regras:
- Máximo 300 caracteres
- Sem travessão (use vírgula ou dois-pontos)
- Sem emojis
- Comece com o primeiro nome do autor(a)
- Para notas 1-2: não mencione o nome do estabelecimento, convide para contato por telefone
- Para notas 4-5: mencione brevemente o serviço se citado na avaliação
- Apenas o texto da resposta, sem aspas`,
      },
    ],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text.trim() : ''
}

// ---------------------------------------------------------------------------
// Seeder de reviews mock no banco (chamado uma vez no setup do perfil)
// ---------------------------------------------------------------------------

export function buildMockReviews(profileId: string): Omit<Review, 'id'>[] {
  return MOCK_REVIEWS.map(r => ({
    ...r,
    profile_id: profileId,
    created_at: r.review_date,
  }))
}

// ---------------------------------------------------------------------------
// Sincronização de reviews reais da GBP API para o banco
// Chamado no início de cada diagnóstico para manter reviews atualizadas.
// ---------------------------------------------------------------------------

export async function syncProfileReviews(
  db: SupabaseClient,
  profileId: string,
  locationName: string, // "accounts/{id}/locations/{id}"
  accessToken: string
): Promise<{ synced: number; errors: number }> {
  let synced = 0
  let errors = 0

  try {
    const reviews = await listGmbReviews(accessToken, locationName)

    for (const r of reviews) {
      const replyStatus = r.hasReply ? 'replied' : 'pending'

      const { error } = await db
        .from('gmb_reviews')
        .upsert(
          {
            profile_id: profileId,
            google_review_id: r.name, // caminho completo: usado para reply via API
            author: r.reviewer,
            rating: r.starRating,
            text: r.comment,
            reply_status: replyStatus,
            review_date: r.createTime,
          },
          { onConflict: 'google_review_id', ignoreDuplicates: false }
        )

      if (error) {
        console.error('[reviews/sync] erro ao upsert review:', error.message)
        errors++
      } else {
        synced++
      }
    }
  } catch (err) {
    console.error('[reviews/sync] erro ao buscar reviews da GBP API:', err)
    errors++
  }

  return { synced, errors }
}
