import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateReviewReply } from '@/lib/gmb/reviews'
import { logger } from '@/lib/logger'
import { rateLimitStrict } from '@/lib/redis'
import { z } from 'zod'

const GenerateReplyBody = z.object({
  reviewId: z.string().min(1),
})

// POST /api/reviews/generate-reply
// Body: { reviewId }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // HIGH-03: rate limit — máx 30 respostas geradas por usuário por hora
  try {
    const count = await rateLimitStrict(`review-reply:${user.id}`, 3600)
    if (count > 30) {
      logger.warn('reviews/generate-reply', 'rate limit atingido', { userId: user.id })
      return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
    }
  } catch {
    return NextResponse.json({ error: 'Serviço temporariamente indisponível. Tente novamente em instantes.' }, { status: 503 })
  }

  const parsed = GenerateReplyBody.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'reviewId obrigatório' }, { status: 400 })
  }
  const { reviewId } = parsed.data

  const serviceClient = await createServiceClient()

  // Carregar review + profile (verify ownership via join)
  const { data: review } = await serviceClient
    .from('gmb_reviews')
    .select('*, gmb_profiles(name, category, user_id)')
    .eq('id', reviewId)
    .single()

  if (!review) return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })

  const profileData = review.gmb_profiles as { name: string; category: string; user_id: string } | null
  if (!profileData || profileData.user_id !== user.id) {
    logger.warn('reviews/generate-reply', 'acesso negado', { userId: user.id, reviewId })
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const segment = detectSegment(profileData.category ?? '')

  try {
    logger.info('reviews/generate-reply', 'gerando resposta via Claude', { reviewId, userId: user.id })
    const reply = await generateReviewReply(
      { author: review.author, rating: review.rating, text: review.text },
      segment,
      profileData.name
    )
    logger.info('reviews/generate-reply', 'resposta gerada com sucesso', { reviewId })
    return NextResponse.json({ reply })
  } catch (err) {
    logger.error('reviews/generate-reply', 'Claude API falhou', { reviewId, error: String(err) })
    return NextResponse.json({ error: 'Falha ao gerar resposta' }, { status: 502 })
  }
}

function detectSegment(category: string): string {
  const lower = category.toLowerCase()
  if (lower.includes('dentista') || lower.includes('odonto')) return 'dentista'
  if (lower.includes('médico')) return 'médico'
  if (lower.includes('psicólogo')) return 'psicólogo'
  if (lower.includes('fisio')) return 'fisioterapeuta'
  return 'profissional de saúde'
}
