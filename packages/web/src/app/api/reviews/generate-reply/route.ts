import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateReviewReply } from '@/lib/gmb/reviews'

// POST /api/reviews/generate-reply
// Body: { reviewId }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { reviewId } = await req.json() as { reviewId: string }
  if (!reviewId) return NextResponse.json({ error: 'reviewId obrigatório' }, { status: 400 })

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
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const segment = detectSegment(profileData.category ?? '')

  try {
    const reply = await generateReviewReply(
      { author: review.author, rating: review.rating, text: review.text },
      segment,
      profileData.name
    )
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[generate-reply] Claude API error:', err)
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: `Falha ao gerar resposta: ${message}` }, { status: 502 })
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
