export const dynamic = 'force-dynamic'

// Aprova e publica uma resposta de review pendente (modo manual)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { GBPClient } from '@/lib/google/gbp-client'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { z } from 'zod'

const ResponseIdSchema = z.object({ response_id: z.string().uuid() })

function createServiceClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = ResponseIdSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'response_id invalido' }, { status: 400 })
  const { response_id } = parsed.data

  const admin = createServiceClient()

  // Busca a resposta + organização do usuário
  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const { data: reviewResponse } = await admin
    .from('review_responses')
    .select('id, generated_text, review_id, organization_id')
    .eq('id', response_id)
    .eq('organization_id', professional.organization_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (!reviewResponse) {
    return NextResponse.json({ error: 'Resposta não encontrada ou já processada' }, { status: 404 })
  }

  // Busca o review_id original do GBP
  const { data: review } = await admin
    .from('reviews')
    .select('review_id')
    .eq('id', reviewResponse.review_id)
    .maybeSingle()

  if (!review?.review_id) {
    return NextResponse.json({ error: 'Review não encontrado' }, { status: 500 })
  }

  // Publica via GBP API com token refresh automatico
  let accessToken: string
  try {
    accessToken = await getValidGmbToken(user.id)
  } catch {
    return NextResponse.json({ error: 'Token Google expirado. Reconecte sua conta.' }, { status: 401 })
  }

  try {
    const gbpClient = new GBPClient(accessToken)
    await gbpClient.replyToReview(review.review_id, reviewResponse.generated_text)
  } catch (err) {
    console.error('[reviews/approve] GBP API error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Falha ao publicar resposta no Google. Tente novamente.' }, { status: 502 })
  }

  // Atualiza status para published
  await admin
    .from('review_responses')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', response_id)

  return NextResponse.json({ status: 'published' })
}

// Rejeita uma resposta (descarta sem publicar)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = ResponseIdSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'response_id invalido' }, { status: 400 })
  const { response_id } = parsed.data

  const admin = createServiceClient()

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  await admin
    .from('review_responses')
    .update({ status: 'rejected' })
    .eq('id', response_id)
    .eq('organization_id', professional.organization_id)
    .eq('status', 'pending')

  return NextResponse.json({ status: 'rejected' })
}
