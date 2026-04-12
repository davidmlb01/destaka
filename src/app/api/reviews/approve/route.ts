// Aprova e publica uma resposta de review pendente (modo manual)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

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

  const { response_id } = await request.json()
  if (!response_id) return NextResponse.json({ error: 'response_id obrigatório' }, { status: 400 })

  const admin = createServiceClient()

  // Busca a resposta + organização do usuário
  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const { data: reviewResponse } = await admin
    .from('review_responses')
    .select('id, generated_text, review_id, organization_id')
    .eq('id', response_id)
    .eq('organization_id', professional.organization_id)
    .eq('status', 'pending')
    .single()

  if (!reviewResponse) {
    return NextResponse.json({ error: 'Resposta não encontrada ou já processada' }, { status: 404 })
  }

  // Busca o review_id original do GBP e o token
  const { data: review } = await admin
    .from('reviews')
    .select('review_id')
    .eq('id', reviewResponse.review_id)
    .single()

  const { data: tokenRow } = await admin
    .from('google_tokens')
    .select('access_token')
    .eq('organization_id', professional.organization_id)
    .single()

  if (!review?.review_id || !tokenRow?.access_token) {
    return NextResponse.json({ error: 'Token ou review não encontrado' }, { status: 500 })
  }

  // Publica via GBP API
  const gbpUrl = `https://mybusiness.googleapis.com/v4/${review.review_id}/reply`
  const gbpRes = await fetch(gbpUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${tokenRow.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment: reviewResponse.generated_text }),
  })

  if (!gbpRes.ok) {
    const body = await gbpRes.text()
    return NextResponse.json({ error: `GBP API error: ${body}` }, { status: 502 })
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

  const { response_id } = await request.json()
  if (!response_id) return NextResponse.json({ error: 'response_id obrigatório' }, { status: 400 })

  const admin = createServiceClient()

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

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
