import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { generateWeeklyPost, detectSegment } from '@/lib/gmb/posts'
import { logger } from '@/lib/logger'
import { rateLimitStrict } from '@/lib/redis'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/posts/generate
export async function POST(request: NextRequest) {
  // HIGH-03: rate limit — máx 20 gerações de post por usuário por hora
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    try {
      const count = await rateLimitStrict(`posts-generate:${user.id}`, 3600)
      if (count > 20) {
        logger.warn('posts/generate', 'rate limit atingido', { userId: user.id })
        return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
      }
    } catch {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível. Tente novamente em instantes.' }, { status: 503 })
    }
  }

  const auth = await getAuthenticatedProfile('id, name, category, auto_post_mode')
  if (auth.error) return auth.error

  const { profile, serviceClient } = auth

  logger.info('posts/generate', 'gerando post', { profileId: profile.id, category: profile.category })

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
    logger.error('posts/generate', 'erro ao salvar post', { profileId: profile.id, error: insertError?.message })
    return NextResponse.json({ error: 'Erro ao salvar post' }, { status: 500 })
  }

  logger.info('posts/generate', 'post gerado com sucesso', { postId: post.id, profileId: profile.id, autoPublished: isAutomatic })
  return NextResponse.json({ post, generated, autoPublished: isAutomatic })
}
