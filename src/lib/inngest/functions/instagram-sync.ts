// Instagram-to-GBP Content Pipeline
// Cron semanal: puxa posts do Instagram, reescreve com keywords, publica no GBP
// Spec: docs/destaka/spec-instagram-to-gbp-pipeline.md

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { scrapeInstagramPosts } from '@/lib/instagram/scraper'
import { rewriteCaption } from '@/lib/instagram/rewriter'

const MAX_POSTS_PER_WEEK = 3

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
  const body: Record<string, unknown> = {
    languageCode: 'pt-BR',
    summary: content,
    topicType: 'STANDARD',
  }

  // Se tem imagem do Instagram, inclui no post GBP
  if (imageUrl) {
    body.media = {
      mediaFormat: 'PHOTO',
      sourceUrl: imageUrl,
    }
  }

  const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) return null
  const data = (await res.json()) as { name?: string }
  return data.name ?? null
}

export const instagramSync = inngest.createFunction(
  {
    id: 'instagram-sync',
    concurrency: [{ limit: 1 }],
    triggers: [{ cron: '0 8 * * 1' }], // toda segunda, 8h
  },
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
          const scrapedPosts = await scrapeInstagramPosts(org.instagram_handle, 10)

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

    // Step 7: publicar posts ready no GBP (para orgs com automation_preference = automatico)
    const publishResults = await step.run('publish-ready-posts', async () => {
      const { data: readyPosts } = await db
        .from('instagram_posts')
        .select('id, organization_id, rewritten_caption, image_url')
        .eq('status', 'ready')

      if (!readyPosts || readyPosts.length === 0) return { published: 0 }

      let published = 0

      for (const post of readyPosts) {
        // Verificar se org tem publicacao automatica
        const { data: orgData } = await db
          .from('organizations')
          .select('automation_preference, gbp_location_id')
          .eq('id', post.organization_id)
          .single()

        if (!orgData?.gbp_location_id || orgData.automation_preference !== 'automatico') {
          continue
        }

        // Buscar token Google
        const { data: tokenRow } = await db
          .from('google_tokens')
          .select('access_token')
          .eq('organization_id', post.organization_id)
          .single()

        if (!tokenRow?.access_token) continue

        const gbpPostId = await publishGbpPost(
          tokenRow.access_token,
          orgData.gbp_location_id,
          post.rewritten_caption,
          post.image_url
        )

        if (gbpPostId) {
          await db
            .from('instagram_posts')
            .update({
              status: 'published',
              gbp_post_id: gbpPostId,
              published_to_gbp_at: new Date().toISOString(),
            })
            .eq('id', post.id)

          // Tambem inserir na tabela posts para aparecer no dashboard
          await db.from('posts').insert({
            organization_id: post.organization_id,
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
          await db
            .from('instagram_posts')
            .update({ status: 'failed', skip_reason: 'Publicacao GBP falhou' })
            .eq('id', post.id)
        }
      }

      return { published }
    })

    return {
      processed: results.length,
      results,
      published: publishResults.published,
    }
  }
)
