// Story 005: Content Automation — gera e publica 2-3 posts/semana no GBP
// Cron: segunda, quarta e sexta às 10h

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { generatePost, nextPostType, type PostType } from '@/lib/gbp/post-generator-engine'
import type { ReviewTone } from '@/lib/gbp/review-response-engine'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function publishGbpPost(
  accessToken: string,
  locationName: string,
  content: string
): Promise<string | null> {
  // locationName = "accounts/{}/locations/{}"
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      languageCode: 'pt-BR',
      summary: content,
      topicType: 'STANDARD',
    }),
  })
  if (!res.ok) return null
  const data = await res.json() as { name?: string }
  return data.name ?? null
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
        // Busca configurações da org
        const { data: org } = await db
          .from('organizations')
          .select('name, specialty, tone, automation_preference, gbp_location_id, service_areas')
          .eq('id', orgId)
          .single()

        if (!org?.gbp_location_id) {
          return { org_id: orgId, status: 'skip', error: 'gbp_location_id não configurado' }
        }

        const { data: tokenRow } = await db
          .from('google_tokens')
          .select('access_token')
          .eq('organization_id', orgId)
          .single()

        if (!tokenRow?.access_token) {
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

        // Determina próximo tipo de post (rotação)
        const { data: recentPosts } = await db
          .from('posts')
          .select('post_type')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(4)

        const recentTypes = (recentPosts ?? []).map((p: { post_type: string }) => p.post_type as PostType)
        const postType = nextPostType(recentTypes)

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
          // Se não há review 5 estrelas, troca para educativo
          if (!recentReview) {
            return { org_id: orgId, status: 'skip', error: 'sem review 5 estrelas para highlight' }
          }
        }

        // Gera o post via Claude
        const generated = await generatePost({
          postType,
          specialty: org.specialty,
          professionalName: org.name,
          city,
          tone: org.tone as ReviewTone,
          recentReview,
          serviceAreas: org.service_areas ?? [],
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
            tokenRow.access_token,
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
