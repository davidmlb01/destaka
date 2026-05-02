import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateWeeklyPost } from '@/lib/gmb/posts'
import { createLocalPost } from '@/lib/gmb/client'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { validateCronAuth } from '@/lib/cron-auth'
import { logger } from '@/lib/logger'

// POST /api/cron/post-generator
// Vercel Cron: seg/qua/sex às 10h
// Gera posts automáticos para perfis com auto_post_mode = 'automatic' ou guarda como rascunho
export async function POST(request: NextRequest) {
  const authError = validateCronAuth(request)
  if (authError) return authError

  const startedAt = Date.now()
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Filtra apenas usuários pro — evita gerar posts para plano free
  const { data: proUsers } = await db.from('users').select('id').neq('plan', 'free')
  const proUserIds = (proUsers ?? []).map((u: { id: string }) => u.id)

  const { data: profiles, error: profilesError } = await db
    .from('gmb_profiles')
    .select('id, name, category, auto_post_mode, user_id, google_location_id')
    .in('user_id', proUserIds.length ? proUserIds : ['00000000-0000-0000-0000-000000000000'])

  if (profilesError) {
    console.error('[cron/post-generator] profiles query error:', profilesError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!profiles?.length) {
    console.log('[cron/post-generator] no profiles found')
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const results: Array<{ profileId: string; status: 'published' | 'draft' | 'error'; error?: string }> = []

  for (const profile of profiles) {
    try {
      // Evita gerar post se já tem um publicado/rascunho hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: existing } = await db
        .from('gmb_posts')
        .select('id')
        .eq('profile_id', profile.id)
        .in('status', ['published', 'draft'])
        .gte('created_at', today.toISOString())
        .limit(1)

      if (existing?.length) {
        results.push({ profileId: profile.id, status: 'draft' })
        continue
      }

      const generated = await generateWeeklyPost(
        profile.category ?? 'saúde',
        profile.name
      )

      // Tenta publicar na GBP API quando modo automático
      let status: 'published' | 'draft' = 'draft'
      if (profile.auto_post_mode === 'automatic' && profile.user_id && profile.google_location_id) {
        try {
          const accessToken = await getValidGmbToken(profile.user_id)
          await createLocalPost(accessToken, profile.google_location_id, generated.content)
          status = 'published'
        } catch (gbpErr) {
          // Token inválido ou API falhou — salva como rascunho para publicação manual
          logger.warn('cron/post-generator', 'falha ao publicar na GBP, salvando como rascunho', {
            profileId: profile.id,
            err: String(gbpErr),
          })
        }
      }

      const now = new Date().toISOString()
      const { error: insertError } = await db.from('gmb_posts').insert({
        profile_id: profile.id,
        content: generated.content,
        type: generated.type,
        status,
        published_at: status === 'published' ? now : null,
      })

      if (insertError) {
        logger.error('cron/post-generator', 'erro ao inserir post', { profileId: profile.id, err: insertError.message })
        results.push({ profileId: profile.id, status: 'error', error: insertError.message })
      } else {
        results.push({ profileId: profile.id, status })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error('cron/post-generator', 'erro ao gerar post', { profileId: profile.id, err: message })
      results.push({ profileId: profile.id, status: 'error', error: message })
    }
  }

  const summary = {
    ok: true,
    duration_ms: Date.now() - startedAt,
    processed: results.length,
    published: results.filter(r => r.status === 'published').length,
    drafted: results.filter(r => r.status === 'draft').length,
    errors: results.filter(r => r.status === 'error').length,
  }

  logger.info('cron/post-generator', 'concluído', summary)
  return NextResponse.json(summary)
}
