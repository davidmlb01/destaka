// Aprova e publica um post pendente (modo manual) ou rejeita
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { GBPClient } from '@/lib/google/gbp-client'
import { getValidGmbToken } from '@/lib/gmb/auth'

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

  const { post_id } = await request.json()
  if (!post_id) return NextResponse.json({ error: 'post_id obrigatório' }, { status: 400 })

  const admin = createServiceClient()

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const { data: post } = await admin
    .from('posts')
    .select('id, content, organization_id')
    .eq('id', post_id)
    .eq('organization_id', professional.organization_id)
    .eq('status', 'pending')
    .single()

  if (!post) return NextResponse.json({ error: 'Post não encontrado ou já processado' }, { status: 404 })

  // Busca location_id
  const { data: org } = await admin
    .from('organizations')
    .select('gbp_location_id')
    .eq('id', professional.organization_id)
    .single()

  if (!org?.gbp_location_id) {
    return NextResponse.json({ error: 'Location GBP não configurado' }, { status: 500 })
  }

  // Token com refresh automatico
  let accessToken: string
  try {
    accessToken = await getValidGmbToken(user.id)
  } catch {
    return NextResponse.json({ error: 'Token Google expirado. Reconecte sua conta.' }, { status: 401 })
  }

  // Publica no GBP
  let gbpData: { name?: string }
  try {
    const gbpClient = new GBPClient(accessToken)
    gbpData = await gbpClient.createPost(org.gbp_location_id, { summary: post.content })
  } catch (err) {
    return NextResponse.json({ error: `GBP API error: ${err instanceof Error ? err.message : 'unknown'}` }, { status: 502 })
  }

  await admin
    .from('posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      gbp_post_id: gbpData.name ?? null,
    })
    .eq('id', post_id)

  return NextResponse.json({ status: 'published', gbp_post_id: gbpData.name })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id } = await request.json()
  if (!post_id) return NextResponse.json({ error: 'post_id obrigatório' }, { status: 400 })

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
    .from('posts')
    .update({ status: 'rejected' })
    .eq('id', post_id)
    .eq('organization_id', professional.organization_id)
    .eq('status', 'pending')

  return NextResponse.json({ status: 'rejected' })
}
