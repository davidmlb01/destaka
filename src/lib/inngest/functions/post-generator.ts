// Story 005: Content Automation — gera e publica 2-3 posts/semana no GBP
// Cron: segunda, quarta e sexta às 10h

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { generatePost, nextPostType, type PostType } from '@/lib/gbp/post-generator-engine'
import type { ReviewTone } from '@/lib/gbp/review-response-engine'
import { GBPClient } from '@/lib/google/gbp-client'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function publishGbpPost(
  accessToken: string,
  locationName: string,
  content: string,
  imageUrl?: string
): Promise<string | null> {
  try {
    const client = new GBPClient(accessToken)
    const post = await client.createPost(locationName, { summary: content, imageUrl })
    return post.name ?? null
  } catch (err) {
    console.error('[post-generator] Falha ao publicar no GBP:', err)
    return null
  }
}

export const postGenerator = inngest.createFunction(
  {
    id: 'post-generator',
    triggers: [{ cron: '0 10 * * 1,3,5' }],
  },
  async ({ step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const { data } = await db.from('google_tokens').select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; status: string; post_type?: string; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`generate-post-${orgId}`, async () => {
        // Busca configuracoes da org (necessario para Instagram e IA)
        const { data: org } = await db
          .from('organizations')
          .select('name, specialty, tone, automation_preference, gbp_location_id, service_areas')
          .eq('id', orgId)
          .single()

        if (!org?.gbp_location_id) {
          return { org_id: orgId, status: 'skip', error: 'gbp_location_id nao configurado' }
        }

        // Instagram tem prioridade: se ha posts ready, publicar 1 em vez de gerar IA
        const { data: instagramReady } = await db
          .from('instagram_posts')
          .select('id, rewritten_caption, image_url')
          .eq('organization_id', orgId)
          .eq('status', 'ready')
          .order('engagement_score', { ascending: false })
          .limit(1)

        if (instagramReady && instagramReady.length > 0) {
          const igPost = instagramReady[0]

          const isAutomatic = org.automation_preference === 'automatico'

          if (isAutomatic) {
            const validToken = await getValidTokenForOrg(db, orgId)
            if (validToken) {
              const gbpPostId = await publishGbpPost(validToken, org.gbp_location_id, igPost.rewritten_caption, igPost.image_url)

              await db.from('instagram_posts')
                .update({
                  status: gbpPostId ? 'published' : 'failed',
                  gbp_post_id: gbpPostId,
                  published_to_gbp_at: gbpPostId ? new Date().toISOString() : null,
                  ...(gbpPostId ? {} : { skip_reason: 'Publicacao GBP falhou' }),
                })
                .eq('id', igPost.id)

              if (gbpPostId) {
                await db.from('posts').insert({
                  organization_id: orgId,
                  content: igPost.rewritten_caption,
                  post_type: 'instagram_adapted',
                  status: 'published',
                  published_at: new Date().toISOString(),
                  gbp_post_id: gbpPostId,
                  photo_suggestion: 'Foto original do Instagram',
                  source: 'instagram',
                })
              }

              return { org_id: orgId, status: gbpPostId ? 'published' : 'failed', post_type: 'instagram_adapted' }
            }
          }

          // Se nao e automatico, marca como pending para aprovacao
          await db.from('posts').insert({
            organization_id: orgId,
            content: igPost.rewritten_caption,
            post_type: 'instagram_adapted',
            status: 'pending',
            photo_suggestion: 'Foto original do Instagram',
            source: 'instagram',
          })

          return { org_id: orgId, status: 'pending', post_type: 'instagram_adapted' }
        }

        const validToken = await getValidTokenForOrg(db, orgId)

        if (!validToken) {
          return { org_id: orgId, status: 'skip', error: 'sem token Google' }
        }

        // Busca city do endereço GBP
        const { data: profile } = await db
          .from('gbp_profiles')
          .select('address')
          .eq('organization_id', orgId)
          .single()

        const address = profile?.address as { locality?: string; addressLines?: string[] } | null
        const city = address?.locality ?? 'Brasil'

        // Determina próximo tipo de post (rotação) + sequência para seed de diversidade (Correção C)
        const { data: recentPosts } = await db
          .from('posts')
          .select('post_type')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(4)

        const { count: postCount } = await db
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)

        const recentTypes = (recentPosts ?? []).map((p: { post_type: string }) => p.post_type as PostType)
        let postType = nextPostType(recentTypes)
        const postSequence = postCount ?? 0

        // Para review_highlight: busca o melhor review recente
        let recentReview: string | undefined
        if (postType === 'review_highlight') {
          const { data: topReview } = await db
            .from('reviews')
            .select('comment')
            .eq('organization_id', orgId)
            .eq('rating', 5)
            .not('comment', 'is', null)
            .order('published_at', { ascending: false })
            .limit(1)
            .single()
          recentReview = topReview?.comment ?? undefined
          // Se nao ha review 5 estrelas, troca para educativo (nao pula)
          if (!recentReview) {
            postType = 'educativo' as PostType
          }
        }

        // Gera o post via Claude (com seed de diversidade para evitar duplicação entre clientes)
        const generated = await generatePost({
          postType,
          specialty: org.specialty,
          professionalName: org.name,
          city,
          tone: org.tone as ReviewTone,
          recentReview,
          serviceAreas: org.service_areas ?? [],
          postSequence,
        })

        // Bloqueia post se não passou no compliance
        if (!generated.compliance_passed) {
          await db.from('posts').insert({
            organization_id: orgId,
            content: generated.content,
            post_type: postType,
            status: 'rejected',
            photo_suggestion: generated.photo_suggestion,
          })
          return { org_id: orgId, status: 'compliance_blocked', post_type: postType }
        }

        const isAutomatic = org.automation_preference === 'automatico'

        if (isAutomatic) {
          // Publica direto no GBP
          const gbpPostId = await publishGbpPost(
            validToken,
            org.gbp_location_id,
            generated.content
          )

          await db.from('posts').insert({
            organization_id: orgId,
            content: generated.content,
            post_type: postType,
            status: gbpPostId ? 'published' : 'pending',
            published_at: gbpPostId ? new Date().toISOString() : null,
            gbp_post_id: gbpPostId,
            photo_suggestion: generated.photo_suggestion,
          })

          return { org_id: orgId, status: gbpPostId ? 'published' : 'pending', post_type: postType }
        } else {
          // Enfileira para aprovação manual
          await db.from('posts').insert({
            organization_id: orgId,
            content: generated.content,
            post_type: postType,
            status: 'pending',
            photo_suggestion: generated.photo_suggestion,
          })
          return { org_id: orgId, status: 'pending', post_type: postType }
        }
      })

      results.push(result as { org_id: string; status: string; post_type?: string; error?: string })
    }

    return { processed: results.length, results }
  }
)
