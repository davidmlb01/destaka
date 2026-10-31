// Story 005: Content Automation — gera e publica 2-3 posts/semana no GBP
// Cron: segunda, quarta e sexta às 10h

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { generatePost, nextPostType, type PostType } from '@/lib/gbp/post-generator-engine'
import type { ReviewTone } from '@/lib/gbp/review-response-engine'
import { GBPClient } from '@/lib/google/gbp-client'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'
import { getLatestAnalysis } from '@/lib/gmb/competitive-analyzer'
import { resend, FROM } from '@/lib/email/index'
import { getBrandName } from '@/lib/vertical-vocab'
import { publishPost as zernioPublishPost } from '@/lib/zernio/client'

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
      console.warn(`[post-generator] Org ${orgId} sem zernio_account_id. GBP v4 bloqueado pelo Google. Conectar Zernio e obrigatorio.`)
      return null
    }

    return await zernioPublishPost(org.zernio_account_id, content, imageUrl)
  } catch (err) {
    console.error('[post-generator] Zernio publish failed:', err)
    return null
  }
}

async function publishGbpPostLegacy(
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
    console.error('[post-generator] Falha ao publicar no GBP (legacy):', err)
    return null
  }
}

export const postGenerator = inngest.createFunction(
  {
    id: 'post-generator',
    triggers: [
      { cron: '0 10 * * 1,3,5' },
      { event: 'destaka/post.generate.requested' },
    ],
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
            // Try Zernio first, then GBP v4 legacy
            let gbpPostId = await publishViaZernio(orgId, igPost.rewritten_caption, igPost.image_url)
            if (!gbpPostId) {
              const validToken = await getValidTokenForOrg(db, orgId)
              if (validToken) {
                gbpPostId = await publishGbpPostLegacy(validToken, org.gbp_location_id, igPost.rewritten_caption, igPost.image_url)
              }
            }

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
        // Token is optional now: Zernio handles publishing auth
        // Only skip if no token AND no Zernio account (checked at publish time)

        // Busca city do endereço GBP
        const { data: profile } = await db
          .from('gbp_profiles')
          .select('address')
          .eq('organization_id', orgId)
          .single()

        const address = profile?.address as { locality?: string; addressLines?: string[] } | null
        const city = address?.locality ?? 'Brasil'

        // Buscar keyword_opportunities da analise competitiva (inteligencia interna)
        const competitiveAnalysis = await getLatestAnalysis(db, orgId)
        const keywordOpportunities = (competitiveAnalysis?.keyword_opportunities ?? []).slice(0, 3)

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
          keywordOpportunities,
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
          // Try Zernio first, then GBP v4 legacy
          let gbpPostId = await publishViaZernio(orgId, generated.content)
          if (!gbpPostId && validToken) {
            gbpPostId = await publishGbpPostLegacy(validToken, org.gbp_location_id, generated.content)
          }

          const postStatus = gbpPostId ? 'published' : 'failed'
          if (!gbpPostId) {
            console.error(`[post-generator] Org ${orgId}: Zernio e GBP v4 falharam. Post salvo como failed.`)
          }
          await db.from('posts').insert({
            organization_id: orgId,
            content: generated.content,
            post_type: postType,
            status: postStatus,
            published_at: gbpPostId ? new Date().toISOString() : null,
            gbp_post_id: gbpPostId,
            photo_suggestion: generated.photo_suggestion,
            error_detail: gbpPostId ? null : 'Publicacao falhou: Zernio e GBP v4 indisponiveis',
          })

          return { org_id: orgId, status: postStatus, post_type: postType }
        } else {
          // Enfileira para aprovação manual
          await db.from('posts').insert({
            organization_id: orgId,
            content: generated.content,
            post_type: postType,
            status: 'pending',
            photo_suggestion: generated.photo_suggestion,
          })

          // Notifica profissional por email sobre post pendente
          try {
            const { data: prof } = await db
              .from('professionals')
              .select('email, name')
              .eq('organization_id', orgId)
              .eq('role', 'owner')
              .maybeSingle()

            if (prof?.email) {
              const brand = getBrandName(org.specialty as string ?? null)
              const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'
              await resend.emails.send({
                from: `${brand} <${FROM}>`,
                to: prof.email,
                subject: `Novo post pronto para aprovacao no seu perfil`,
                html: `<p>Olá ${(prof.name ?? '').split(' ')[0]},</p>
<p>O ${brand} criou um novo post para o seu perfil no Google. Como você escolheu o modo com aprovação, o post está aguardando sua revisão.</p>
<p><a href="${appUrl}/dashboard/posts" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Ver e aprovar post</a></p>
<p style="color:#6b7280;font-size:13px;">Se não aprovar em 7 dias, o post será descartado automaticamente.</p>`,
              })
            }
          } catch (emailErr) {
            console.error(`[post-generator] Falha ao enviar email de notificacao para org ${orgId}:`, emailErr)
          }

          return { org_id: orgId, status: 'pending', post_type: postType }
        }
      })

      results.push(result as { org_id: string; status: string; post_type?: string; error?: string })
    }

    return { processed: results.length, results }
  }
)
