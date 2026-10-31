// Instagram-to-GBP Content Pipeline
// Cron semanal: puxa posts do Instagram, reescreve com keywords, publica no GBP
// Spec: docs/destaka/spec-instagram-to-gbp-pipeline.md

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { scrapeInstagramPosts } from '@/lib/instagram/scraper'
import { rewriteCaption } from '@/lib/instagram/rewriter'
import { GBPClient } from '@/lib/google/gbp-client'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'
import { publishPost as zernioPublishPost } from '@/lib/zernio/client'
import { geotagAndUpload } from '@/lib/media/geotag'

const MAX_POSTS_PER_WEEK = 3
const MAX_GBP_PUBLISHES_PER_WEEK = 2

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function publishViaZernio(
  orgId: string,
  content: string,
  imageUrl?: string
): Promise<string | null> {
  try {
    const db = admin()
    const { data: org } = await db
      .from('organizations')
      .select('zernio_account_id')
      .eq('id', orgId)
      .maybeSingle()

    if (!org?.zernio_account_id) {
      console.warn(`[instagram-sync] Org ${orgId} sem zernio_account_id, tentando GBP v4 legacy`)
      return null
    }

    return await zernioPublishPost(org.zernio_account_id, content, imageUrl)
  } catch (err) {
    console.error('[instagram-sync] Zernio publish failed:', err)
    return null
  }
}

export const instagramSync = inngest.createFunction(
  {
    id: 'instagram-sync',
    concurrency: [{ limit: 1 }],
    triggers: [{ event: 'destaka/instagram.sync.requested' }, { cron: '0 7 * * 1' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inngest step typing
  async ({ step }: { step: any }) => {
    const db = admin()

    // Step 1: buscar orgs com instagram_handle configurado
    const orgs = await step.run('resolve-instagram-orgs', async () => {
      const { data } = await db
        .from('organizations')
        .select('id, name, specialty, instagram_handle, tone, gbp_location_id, service_areas')
        .not('instagram_handle', 'is', null)

      return (data ?? []).filter(
        (org: { instagram_handle: string | null }) => org.instagram_handle
      )
    })

    if (orgs.length === 0) {
      return { processed: 0, message: 'Nenhuma org com Instagram configurado' }
    }

    const results: Array<{ org_id: string; status: string; posts_scraped?: number; posts_ready?: number; error?: string }> = []

    for (const org of orgs) {
      const result = await step.run(`sync-instagram-${org.id}`, async () => {
        try {
          // Step 2: scrape posts recentes
          const scrapedPosts = await scrapeInstagramPosts(org.instagram_handle, 30)

          if (scrapedPosts.length === 0) {
            return { org_id: org.id, status: 'no_new_posts', posts_scraped: 0 }
          }

          // Step 3: filtrar posts ja processados (dedup por instagram_post_id)
          const { data: existing } = await db
            .from('instagram_posts')
            .select('instagram_post_id')
            .eq('organization_id', org.id)

          const existingIds = new Set(
            (existing ?? []).map((e: { instagram_post_id: string }) => e.instagram_post_id)
          )

          const newPosts = scrapedPosts.filter((p) => !existingIds.has(p.id))

          if (newPosts.length === 0) {
            return { org_id: org.id, status: 'all_already_processed', posts_scraped: scrapedPosts.length }
          }

          // Step 4: ordenar por engajamento e limitar a MAX_POSTS_PER_WEEK
          const sorted = newPosts
            .sort((a, b) => b.likesCount - a.likesCount)
            .slice(0, MAX_POSTS_PER_WEEK)

          // Buscar cidade do GBP
          const { data: profile } = await db
            .from('gbp_profiles')
            .select('address')
            .eq('organization_id', org.id)
            .maybeSingle()

          const address = profile?.address as { locality?: string } | null
          const city = address?.locality ?? 'Brasil'

          // Buscar keyword opportunities da inteligencia competitiva
          const { data: competitiveData } = await db
            .from('competitive_analyses')
            .select('keyword_opportunities')
            .eq('organization_id', org.id)
            .order('analyzed_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const keywordOpps = (competitiveData?.keyword_opportunities as string[] | null) ?? []

          let readyCount = 0

          for (const post of sorted) {
            // Inserir como scraped
            await db.from('instagram_posts').insert({
              organization_id: org.id,
              instagram_post_id: post.id,
              instagram_shortcode: post.shortCode,
              image_url: post.imageUrl,
              original_caption: post.caption,
              engagement_score: post.likesCount,
              status: 'rewriting',
            })

            // Step 5: reescrever com keywords SEO
            if (!post.caption || post.caption.trim().length < 10) {
              await db
                .from('instagram_posts')
                .update({ status: 'skipped', skip_reason: 'Caption muito curta ou vazia' })
                .eq('organization_id', org.id)
                .eq('instagram_post_id', post.id)
              continue
            }

            const rewrite = await rewriteCaption({
              originalCaption: post.caption,
              specialty: org.specialty ?? 'saude',
              professionalName: org.name ?? '',
              city,
              tone: org.tone ?? 'proximo',
              keywords: keywordOpps.slice(0, 3),
            })

            if (!rewrite.compliancePassed || !rewrite.rewrittenCaption) {
              await db
                .from('instagram_posts')
                .update({
                  status: 'skipped',
                  skip_reason: rewrite.complianceNotes ?? 'Compliance falhou',
                  rewritten_caption: rewrite.rewrittenCaption || null,
                })
                .eq('organization_id', org.id)
                .eq('instagram_post_id', post.id)
              continue
            }

            // Step 6: marcar como ready
            await db
              .from('instagram_posts')
              .update({
                rewritten_caption: rewrite.rewrittenCaption,
                keywords_injected: rewrite.keywordsInjected,
                status: 'ready',
              })
              .eq('organization_id', org.id)
              .eq('instagram_post_id', post.id)

            readyCount++
          }

          return {
            org_id: org.id,
            status: 'synced',
            posts_scraped: scrapedPosts.length,
            posts_ready: readyCount,
          }
        } catch (err) {
          return {
            org_id: org.id,
            status: 'error',
            error: err instanceof Error ? err.message : 'Erro desconhecido',
          }
        }
      })

      results.push(result)
    }

    // Step 7: publicar posts ready no GBP (max 2 por semana por org)
    const publishResults: Array<{ org_id: string; published: number; skipped: number }> = []

    for (const org of orgs) {
      const pubResult = await step.run(`publish-gbp-${org.id}`, async () => {
        // Verificar se org usa modo automatico
        const { data: orgData } = await db
          .from('organizations')
          .select('automation_preference, gbp_location_id')
          .eq('id', org.id)
          .single()

        if (!orgData?.gbp_location_id || orgData.automation_preference !== 'automatico') {
          return { org_id: org.id, published: 0, skipped: 0 }
        }

        // Contar quantos posts ja foram publicados esta semana
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const { count: publishedThisWeek } = await db
          .from('instagram_posts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('status', 'published_gbp')
          .gte('published_to_gbp_at', weekAgo.toISOString())

        const remainingSlots = MAX_GBP_PUBLISHES_PER_WEEK - (publishedThisWeek ?? 0)
        if (remainingSlots <= 0) {
          return { org_id: org.id, published: 0, skipped: 0 }
        }

        // Buscar posts ready para publicar
        const { data: readyPosts } = await db
          .from('instagram_posts')
          .select('id, rewritten_caption, image_url')
          .eq('organization_id', org.id)
          .eq('status', 'ready')
          .not('rewritten_caption', 'is', null)
          .order('engagement_score', { ascending: false })
          .limit(remainingSlots)

        if (!readyPosts || readyPosts.length === 0) {
          return { org_id: org.id, published: 0, skipped: 0 }
        }

        let published = 0
        let skipped = 0

        for (const post of readyPosts) {
          try {
            // Geotag na imagem com coordenadas do perfil GBP
            const geotaggedUrl = post.image_url ? await geotagAndUpload(org.id, post.image_url) : undefined
            // Zernio primeiro, GBP v4 legacy como fallback
            let gbpPostId = await publishViaZernio(org.id, post.rewritten_caption, geotaggedUrl)

            if (!gbpPostId) {
              const validToken = await getValidTokenForOrg(db, org.id)
              if (validToken) {
                const client = new GBPClient(validToken)
                const gbpPost = await client.createPost(orgData.gbp_location_id, {
                  summary: post.rewritten_caption,
                  imageUrl: geotaggedUrl,
                })
                gbpPostId = gbpPost.name ?? null
              }
            }

            if (gbpPostId) {
              await db.from('instagram_posts')
                .update({
                  status: 'published_gbp',
                  gbp_post_id: gbpPostId,
                  published_to_gbp_at: new Date().toISOString(),
                })
                .eq('id', post.id)

              await db.from('posts').insert({
                organization_id: org.id,
                content: post.rewritten_caption,
                post_type: 'instagram_adapted',
                status: 'published',
                published_at: new Date().toISOString(),
                gbp_post_id: gbpPostId,
                photo_suggestion: 'Foto original do Instagram',
                source: 'instagram',
              })
              published++
            } else {
              console.error(`[instagram-sync] Post ${post.id}: Zernio e GBP v4 falharam`)
              await db.from('instagram_posts')
                .update({
                  status: 'failed',
                  skip_reason: 'Zernio e GBP v4 falharam na publicacao',
                })
                .eq('id', post.id)
              skipped++
            }
          } catch (err) {
            console.error(`[instagram-sync] Falha ao publicar post ${post.id}:`, err)
            await db.from('instagram_posts')
              .update({
                status: 'failed',
                skip_reason: err instanceof Error ? err.message : 'Publicacao falhou',
              })
              .eq('id', post.id)
            skipped++
          }
        }

        return { org_id: org.id, published, skipped }
      })

      publishResults.push(pubResult)
    }

    return {
      processed: results.length,
      results,
      publishing: publishResults,
    }
  }
)
