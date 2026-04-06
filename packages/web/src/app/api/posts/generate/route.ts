import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateWeeklyPost, detectSegment } from '@/lib/gmb/posts'

export const dynamic = 'force-dynamic'

// POST /api/posts/generate
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const serviceClient = await createServiceClient()

  const { data: profile } = await serviceClient
    .from('gmb_profiles')
    .select('id, name, category')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile) return NextResponse.json({ error: 'Nenhum perfil encontrado' }, { status: 404 })

  const segment = detectSegment(profile.category ?? '')
  const generated = await generateWeeklyPost(segment, profile.name)

  const isAutomatic = false // auto_post_mode via settings (migration 003)

  const { data: post, error: insertError } = await serviceClient
    .from('gmb_posts')
    .insert({
      profile_id: profile.id,
      content: generated.content,
      type: generated.type,
      status: isAutomatic ? 'scheduled' : 'draft',
      scheduled_for: isAutomatic ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (insertError || !post) {
    console.error('[posts/generate] insertError:', insertError)
    return NextResponse.json({ error: 'Erro ao salvar post' }, { status: 500 })
  }

  return NextResponse.json({ post, generated, autoPublished: isAutomatic })
}
