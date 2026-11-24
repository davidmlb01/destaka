// Story 005: Content Automation — gera 5 posts na segunda-feira e agenda um por dia útil
// Cron: apenas segunda-feira às 10h UTC (07h BRT)

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
import { geotagAndUpload } from '@/lib/media/geotag'

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
      { cron: '0 10 * * 1' },
      { event: 'destaka/post.generate.requested' },
    ],
  },
  async ({ step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const { data } = await db.from('google_tokens').select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; status: string; post_type?: string; posts_generated?: number; posts_blocked_compliance?: number; post_types?: PostType[]; error?: string }> = []

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
            // Geotag na imagem com coordenadas do perfil GBP
            const geotaggedUrl = igPost.image_url ? await geotagAndUpload(orgId, igPost.image_url) : undefined
            // Try Zernio first, then GBP v4 legacy
            let gbpPostId = await publishViaZernio(orgId, igPost.rewritten_caption, geotaggedUrl)
            if (!gbpPostId) {
              const validToken = await getValidTokenForOrg(db, orgId)
              if (validToken) {
                gbpPostId = await publishGbpPostLegacy(validToken, org.gbp_location_id, igPost.rewritten_caption, geotaggedUrl)
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
                post_type: 'educativo',
                status: 'published',
                published_at: new Date().toISOString(),
                gbp_post_id: gbpPostId,
                photo_suggestion: 'Foto original do Instagram',
                source: 'instagram',
              })
            }

            return { org_id: orgId, status: gbpPostId ? 'published' : 'failed', post_type: 'educativo' }
          }

          // Se nao e automatico, marca como pending para aprovacao
          await db.from('posts').insert({
            organization_id: orgId,
            content: igPost.rewritten_caption,
            post_type: 'educativo',
            status: 'pending',
            photo_suggestion: 'Foto original do Instagram',
            source: 'instagram',
          })

          return { org_id: orgId, status: 'pending', post_type: 'educativo' }
        }

        // Verificar se ja existem 5 posts gerados esta semana (evita duplicatas se o cron rodar duas vezes)
        const mondayMidnight = new Date()
        mondayMidnight.setUTCHours(0, 0, 0, 0)
        // Retrocede ate segunda-feira desta semana
        const dayOffset = (mondayMidnight.getUTCDay() + 6) % 7 // 0=seg, 1=ter, ...
        mondayMidnight.setUTCDate(mondayMidnight.getUTCDate() - dayOffset)

        const { count: postsThisWeek } = await db
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .gte('created_at', mondayMidnight.toISOString())
          .in('status', ['pending', 'scheduled', 'published'])

        if ((postsThisWeek ?? 0) >= 5) {
          return { org_id: orgId, status: 'skip', error: 'Posts desta semana ja gerados' }
        }

        const validToken = await getValidTokenForOrg(db, orgId)
        // Token e opcional: Zernio gerencia a autenticacao de publicacao

        // Busca city do endereço GBP
        const { data: profile } = await db
          .from('gbp_profiles')
          .select('address')
          .eq('organization_id', orgId)
          .single()

        const address = profile?.address as { locality?: string; sublocality?: string; formattedAddress?: string; addressLines?: string[] } | null
        const city = address?.locality ?? 'Brasil'
        // Extrair bairro principal do endereco (tenta sublocality, formattedAddress, addressLines)
        const knownBairros = ['Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Leme', 'Urca', 'Catete', 'Laranjeiras', 'Humaitá', 'Lagoa', 'Jardim Botânico', 'Gávea', 'São Conrado', 'Tijuca', 'Centro']
        const fullAddress = address?.formattedAddress ?? (address?.addressLines ?? []).join(', ')
        const neighborhood = address?.sublocality
          ?? knownBairros.find(b => fullAddress.includes(b))
          ?? undefined

        // Bairros vizinhos para expansão geográfica de keywords
        // Cada post usa o bairro principal + 1 bairro vizinho em rotação por índice
        const bairroExpansion: Record<string, string[]> = {
          'Copacabana': ['Ipanema', 'Leme', 'Botafogo', 'Leblon', 'Flamengo'],
          'Ipanema': ['Copacabana', 'Leblon', 'Lagoa', 'Gávea'],
          'Botafogo': ['Copacabana', 'Flamengo', 'Humaitá', 'Urca'],
          'Leblon': ['Ipanema', 'Gávea', 'Jardim Botânico', 'São Conrado'],
          'Flamengo': ['Botafogo', 'Catete', 'Laranjeiras', 'Centro'],
        }
        const vizinhos = neighborhood ? (bairroExpansion[neighborhood] ?? []) : []

        // Buscar keywords de ranking (prioridade) + analise competitiva (fallback)
        const { data: rankingKws } = await db
          .from('ranking_keywords')
          .select('keyword')
          .eq('organization_id', orgId)
          .order('is_primary', { ascending: false })
          .limit(4)

        const baseKeywords: string[] = rankingKws?.length
          ? rankingKws.map((k: { keyword: string }) => k.keyword).slice(0, 3)
          : (await getLatestAnalysis(db, orgId))?.keyword_opportunities?.slice(0, 3) ?? []

        // Buscar posts publicados anteriores para aprender tom e estilo do profissional
        const { data: publishedPosts } = await db
          .from('posts')
          .select('content')
          .eq('organization_id', orgId)
          .eq('status', 'published')
          .not('content', 'is', null)
          .order('published_at', { ascending: false })
          .limit(5)

        const styleExamples = (publishedPosts ?? [])
          .map((p: { content: string }) => p.content)
          .filter(Boolean)

        // Buscar o tipo dos posts mais recentes para a rotação
        const { data: recentPosts } = await db
          .from('posts')
          .select('post_type')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(4)

        const { count: postCount } = await db
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)

        const basePostCount = postCount ?? 0

        // Para review_highlight: busca o melhor review recente (reutilizado nos 5 posts se necessario)
        const { data: topReview } = await db
          .from('reviews')
          .select('comment')
          .eq('organization_id', orgId)
          .eq('rating', 5)
          .not('comment', 'is', null)
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        const bestReview = topReview?.comment ?? undefined

        // Gera 5 posts, um para cada dia util da semana (seg a sex as 13h UTC)
        const PUBLISH_HOUR_UTC = 13
        const scheduleDayOffsets = [0, 1, 2, 3, 4] // dias a partir de segunda-feira desta semana

        const isAutomatic = org.automation_preference === 'automatico'
        const generatedTypes: PostType[] = []
        let skippedCompliance = 0

        for (let i = 0; i < 5; i++) {
          // Calcula a data de agendamento para este post (segunda + i dias, as 13h UTC)
          const scheduleDate = new Date(mondayMidnight)
          scheduleDate.setUTCDate(scheduleDate.getUTCDate() + scheduleDayOffsets[i])
          scheduleDate.setUTCHours(PUBLISH_HOUR_UTC, 0, 0, 0)

          // Rotacao de tipo usando historico + posts gerados nesta rodada
          const recentTypes = [
            ...(recentPosts ?? []).map((p: { post_type: string }) => p.post_type as PostType),
            ...generatedTypes,
          ].slice(-4)
          let postType = nextPostType(recentTypes)

          // Se review_highlight sem review disponivel, troca para educativo
          let recentReview: string | undefined
          if (postType === 'review_highlight') {
            recentReview = bestReview
            if (!recentReview) postType = 'educativo' as PostType
          }

          // Bairro vizinho rotaciona pelo indice do post (nao pelo dia da semana)
          const vizinhoPost = vizinhos.length > 0 ? vizinhos[i % vizinhos.length] : undefined

          // Monta keywords para este post especifico
          const keywordOpportunities = [...baseKeywords]
          if (neighborhood && !keywordOpportunities.some(k => k.includes(neighborhood))) {
            keywordOpportunities.unshift(neighborhood)
          }
          if (vizinhoPost && !keywordOpportunities.includes(vizinhoPost)) {
            keywordOpportunities.push(vizinhoPost)
          }

          // Gera o post via Claude (postSequence garante diversidade entre os 5 posts)
          const generated = await generatePost({
            postType,
            specialty: org.specialty,
            professionalName: org.name,
            city,
            neighborhood: neighborhood || undefined,
            tone: org.tone as ReviewTone,
            recentReview,
            serviceAreas: org.service_areas ?? [],
            styleExamples,
            postSequence: basePostCount + i,
            keywordOpportunities,
          })

          // Bloqueia post se nao passou no compliance
          if (!generated.compliance_passed) {
            await db.from('posts').insert({
              organization_id: orgId,
              content: generated.content,
              post_type: postType,
              status: 'rejected',
              photo_suggestion: generated.photo_suggestion,
              scheduled_at: scheduleDate.toISOString(),
            })
            skippedCompliance++
            continue
          }

          if (isAutomatic) {
            // Modo automatico: publica imediatamente via Zernio ou GBP legacy
            let gbpPostId = await publishViaZernio(orgId, generated.content)
            if (!gbpPostId && validToken) {
              gbpPostId = await publishGbpPostLegacy(validToken, org.gbp_location_id, generated.content)
            }

            const postStatus = gbpPostId ? 'published' : 'failed'
            if (!gbpPostId) {
              console.error(`[post-generator] Org ${orgId} post ${i + 1}/5: Zernio e GBP v4 falharam.`)
            }
            await db.from('posts').insert({
              organization_id: orgId,
              content: generated.content,
              post_type: postType,
              status: postStatus,
              published_at: gbpPostId ? new Date().toISOString() : null,
              gbp_post_id: gbpPostId,
              photo_suggestion: generated.photo_suggestion,
              scheduled_at: scheduleDate.toISOString(),
              error_detail: gbpPostId ? null : 'Publicacao falhou: Zernio e GBP v4 indisponiveis',
            })
          } else {
            // Modo manual: cria como pending com scheduled_at sugerido para a semana
            await db.from('posts').insert({
              organization_id: orgId,
              content: generated.content,
              post_type: postType,
              status: 'pending',
              photo_suggestion: generated.photo_suggestion,
              scheduled_at: scheduleDate.toISOString(),
            })
          }

          generatedTypes.push(postType)
        }

        // Notifica por email uma unica vez (somente modo manual, se ao menos 1 post gerado)
        if (!isAutomatic && generatedTypes.length > 0) {
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
                subject: `${generatedTypes.length} posts prontos para aprovacao esta semana`,
                html: `<p>Olá ${(prof.name ?? '').split(' ')[0]},</p>
<p>O ${brand} criou ${generatedTypes.length} posts para o seu perfil no Google esta semana, um para cada dia útil. Como você escolheu o modo com aprovação, os posts estão aguardando sua revisão.</p>
<p><a href="${appUrl}/dashboard/posts" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Ver e aprovar posts</a></p>
<p style="color:#6b7280;font-size:13px;">Posts não aprovados em 7 dias serão descartados automaticamente.</p>`,
              })
            }
          } catch (emailErr) {
            console.error(`[post-generator] Falha ao enviar email de notificacao para org ${orgId}:`, emailErr)
          }
        }

        return {
          org_id: orgId,
          status: isAutomatic ? 'published' : 'pending',
          posts_generated: generatedTypes.length,
          posts_blocked_compliance: skippedCompliance,
          post_types: generatedTypes,
        }
      })

      results.push(result as { org_id: string; status: string; post_type?: string; error?: string })
    }

    return { processed: results.length, results }
  }
)
