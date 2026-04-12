import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateWeeklyPost } from '@/lib/gmb/posts'

// POST /api/cron/post-generator
// Vercel Cron: seg/qua/sex às 10h
// Gera posts automáticos para perfis com auto_post_mode = 'automatic' ou guarda como rascunho
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profiles, error: profilesError } = await db
    .from('gmb_profiles')
    .select('id, name, category, auto_post_mode')

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

      const status = profile.auto_post_mode === 'automatic' ? 'published' : 'draft'
      const now = new Date().toISOString()

      const { error: insertError } = await db.from('gmb_posts').insert({
        profile_id: profile.id,
        content: generated.content,
        type: generated.type,
        status,
        published_at: status === 'published' ? now : null,
      })

      if (insertError) {
        console.error(`[cron/post-generator] insert error profile=${profile.id}:`, insertError)
        results.push({ profileId: profile.id, status: 'error', error: insertError.message })
      } else {
        results.push({ profileId: profile.id, status })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cron/post-generator] error profile=${profile.id}:`, err)
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

  console.log('[cron/post-generator] done:', summary)
  return NextResponse.json(summary)
}
