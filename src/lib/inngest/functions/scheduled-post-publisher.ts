import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { publishPost as zernioPublishPost } from '@/lib/zernio/client'
import { geotagAndUpload } from '@/lib/media/geotag'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Publica posts agendados cujo scheduled_at já passou.
// Roda segunda, quarta e sexta às 13h UTC (10h BRT).
export const scheduledPostPublisher = inngest.createFunction(
  {
    id: 'scheduled-post-publisher',
    triggers: [
      { cron: '0 13 * * 1-5' },
      { event: 'destaka/posts.publish-scheduled.requested' },
    ],
  },
  async ({ step }) => {
    const db = admin()

    const posts = await step.run('fetch-scheduled-posts', async () => {
      const { data } = await db
        .from('posts')
        .select('id, organization_id, content, photo_suggestion, scheduled_at')
        .in('status', ['scheduled', 'approved'])
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })

      return data ?? []
    })

    if (posts.length === 0) {
      return { published: 0, message: 'Nenhum post agendado para publicar' }
    }

    let published = 0
    let failed = 0

    for (const post of posts) {
      await step.run(`publish-${post.id}`, async () => {
        const { data: org } = await db
          .from('organizations')
          .select('zernio_account_id')
          .eq('id', post.organization_id)
          .maybeSingle()

        if (!org?.zernio_account_id) {
          console.error(`[scheduled-publisher] Org ${post.organization_id} sem zernio_account_id`)
          await db.from('posts').update({ status: 'failed', error_detail: 'Conta Google não conectada' }).eq('id', post.id)
          failed++
          return
        }

        // Geotagging na imagem
        const rawImage = (post as Record<string, string>).photo_suggestion ?? undefined
        let finalImage = rawImage
        if (rawImage && rawImage.startsWith('http')) {
          finalImage = await geotagAndUpload(post.organization_id, rawImage)
        }

        try {
          const gbpPostId = await zernioPublishPost(
            org.zernio_account_id,
            post.content,
            finalImage
          )

          await db.from('posts').update({
            status: 'published',
            published_at: new Date().toISOString(),
            gbp_post_id: gbpPostId ?? null,
          }).eq('id', post.id)

          published++
        } catch (err) {
          console.error(`[scheduled-publisher] Falha ao publicar post ${post.id}:`, err)
          await db.from('posts').update({
            status: 'failed',
            error_detail: err instanceof Error ? err.message : 'Falha na publicação',
          }).eq('id', post.id)
          failed++
        }
      })
    }

    return { published, failed, total: posts.length }
  }
)
