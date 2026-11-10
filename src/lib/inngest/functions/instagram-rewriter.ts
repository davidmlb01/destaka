// Instagram Rewriter: processa posts em status 'rewriting' que ficaram travados
// Roda como cron a cada 30 min ou por evento

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { rewriteCaption } from '@/lib/instagram/rewriter'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const instagramRewriter = inngest.createFunction(
  {
    id: 'instagram-rewriter',
    concurrency: [{ limit: 1 }],
    triggers: [
      { event: 'destaka/instagram.rewrite.requested' },
      { cron: '*/30 * * * *' }, // cada 30 min
    ],
  },
  async ({ step }) => {
    const db = admin()

    const pending = await step.run('get-pending', async () => {
      const { data } = await db
        .from('instagram_posts')
        .select('id, organization_id, original_caption, image_url')
        .eq('status', 'rewriting')
        .limit(5)
      return data ?? []
    })

    if (pending.length === 0) return { processed: 0 }

    let processed = 0

    for (const post of pending) {
      await step.run(`rewrite-${post.id.substring(0, 8)}`, async () => {
        if (!post.original_caption || post.original_caption.trim().length < 10) {
          await db.from('instagram_posts')
            .update({ status: 'skipped', skip_reason: 'Caption muito curta' })
            .eq('id', post.id)
          return
        }

        // Buscar dados da org
        const { data: org } = await db
          .from('organizations')
          .select('name, specialty, tone')
          .eq('id', post.organization_id)
          .maybeSingle()

        // Buscar keywords
        const { data: analysis } = await db
          .from('competitive_analyses')
          .select('keyword_opportunities')
          .eq('organization_id', post.organization_id)
          .order('analyzed_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const keywords = (analysis?.keyword_opportunities as string[] | null)?.slice(0, 3) ?? []

        const rewrite = await rewriteCaption({
          originalCaption: post.original_caption,
          specialty: (org?.specialty as string) ?? 'saude',
          professionalName: (org?.name as string) ?? '',
          city: 'Rio de Janeiro',
          tone: (org?.tone as string) ?? 'proximo',
          keywords,
        })

        if (!rewrite.rewrittenCaption) {
          await db.from('instagram_posts')
            .update({ status: 'skipped', skip_reason: rewrite.complianceNotes ?? 'Rewrite falhou' })
            .eq('id', post.id)
          return
        }

        // Salvar rewrite
        await db.from('instagram_posts').update({
          rewritten_caption: rewrite.rewrittenCaption,
          keywords_injected: rewrite.keywordsInjected,
          status: 'ready',
        }).eq('id', post.id)

        // Criar post na tabela posts
        await db.from('posts').insert({
          organization_id: post.organization_id,
          content: rewrite.rewrittenCaption,
          post_type: 'educativo',
          status: 'pending',
        })

        processed++
      })
    }

    return { processed }
  }
)
