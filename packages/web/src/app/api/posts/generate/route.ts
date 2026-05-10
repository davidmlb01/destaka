import { NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { generateWeeklyPost, detectSegment } from '@/lib/gmb/posts'

export const dynamic = 'force-dynamic'

// POST /api/posts/generate
export async function POST() {
  const auth = await getAuthenticatedProfile('id, name, category, auto_post_mode')
  if (auth.error) return auth.error

  const { profile, serviceClient } = auth

  const segment = detectSegment(profile.category ?? '')
  const generated = await generateWeeklyPost(segment, profile.name)

  const isAutomatic = profile.auto_post_mode === 'automatic'

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
