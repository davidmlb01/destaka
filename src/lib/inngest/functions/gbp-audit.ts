// Story 002: GBP Audit Engine — importação e auditoria do perfil Google Business Profile
// Disparado por evento (onboarding/re-import) ou cron semanal (toda segunda, 9h)

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { GBPClient } from '@/lib/google/gbp-client'
import { runAudit } from '@/lib/gbp/audit-engine'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'
import { enrichCompetitorKeywords } from '@/lib/gmb/competitors'
import { analyzeCompetitivePosition, saveCompetitiveAnalysis, type CompetitorProfile } from '@/lib/gmb/competitive-analyzer'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const gbpAudit = inngest.createFunction(
  {
    id: 'gbp-audit',
    triggers: [
      { cron: '0 9 * * 1' },
      { event: 'destaka/gbp.audit.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()

    // Determina quais organizações processar
    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      if (event.name === 'destaka/gbp.audit.requested') {
        return [(event as unknown as { data: { organization_id: string } }).data.organization_id]
      }
      // Cron: todas as organizações com token Google configurado
      const { data } = await db
        .from('google_tokens')
        .select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; status: string; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`audit-org-${orgId}`, async () => {
        // Busca token com refresh automatico
        const validToken = await getValidTokenForOrg(db, orgId)

        if (!validToken) {
          return { org_id: orgId, status: 'skip', error: 'sem token Google' }
        }

        // Busca specialty e gbp_location_id da organização
        const { data: org } = await db
          .from('organizations')
          .select('specialty, gbp_location_id')
          .eq('id', orgId)
          .single()

        const specialty = org?.specialty ?? 'outro'
        const existingLocationId = org?.gbp_location_id as string | null

        // Inicializa cliente GBP e busca dados
        const gbp = new GBPClient(validToken)

        let accounts: Awaited<ReturnType<GBPClient['listAccounts']>> = []
        try {
          accounts = await gbp.listAccounts()
          console.log('[gbp-audit] accounts:', JSON.stringify(accounts.map(a => ({ name: a.name, type: a.type }))))
        } catch (err) {
          console.error('[gbp-audit] listAccounts error:', err instanceof Error ? err.message : err)
          return { org_id: orgId, status: 'error', error: `falha ao listar accounts GBP: ${err instanceof Error ? err.message : 'unknown'}` }
        }

        if (accounts.length === 0) {
          return { org_id: orgId, status: 'skip', error: 'nenhuma conta GBP encontrada' }
        }

        const accountName = accounts[0].name

        let locations: Awaited<ReturnType<GBPClient['listLocations']>> = []
        try {
          locations = await gbp.listLocations(accountName)
        } catch (err) {
          console.error('[gbp-audit] listLocations error:', err instanceof Error ? err.message : err)
          return { org_id: orgId, status: 'error', error: `falha ao listar locations GBP: ${err instanceof Error ? err.message : 'unknown'}` }
        }

        if (locations.length === 0) {
          return { org_id: orgId, status: 'skip', error: 'nenhuma location GBP encontrada' }
        }

        // Se a org ja tem gbp_location_id, buscar a location correspondente
        // Se nao, usar a primeira (onboarding)
        const location = existingLocationId
          ? locations.find(l => l.name === existingLocationId) ?? locations[0]
          : locations[0]
        const locationName = location.name

        // Busca reviews e mídias em paralelo
        const [reviews, media] = await Promise.allSettled([
          gbp.listReviews(locationName),
          gbp.listMedia(locationName),
        ])

        const reviewList = reviews.status === 'fulfilled' ? reviews.value : []
        const mediaList = media.status === 'fulfilled' ? media.value : []

        // Persiste perfil GBP na tabela gbp_profiles
        const profilePayload = {
          organization_id: orgId,
          location_id: locationName,
          name: location.title ?? null,
          categories: [
            location.categories?.primaryCategory?.displayName,
            ...(location.categories?.additionalCategories?.map(c => c.displayName) ?? []),
          ].filter(Boolean) as string[],
          attributes: location.attributes ?? [],
          services: location.serviceItems ?? [],
          description: location.profile?.description ?? null,
          phone: location.phoneNumbers?.primaryPhone ?? null,
          address: location.storefrontAddress ?? null,
          hours: location.regularHours ?? null,
          photo_count: mediaList.length,
          last_synced_at: new Date().toISOString(),
        }

        await db
          .from('gbp_profiles')
          .upsert(profilePayload, { onConflict: 'organization_id,location_id' })

        // Persiste reviews na tabela reviews
        if (reviewList.length > 0) {
          const reviewPayloads = reviewList.map(r => ({
            organization_id: orgId,
            review_id: r.reviewId,
            author_name: r.reviewer.isAnonymous ? 'Anônimo' : r.reviewer.displayName,
            rating: GBPClient.starRatingToNumber(r.starRating),
            comment: r.comment ?? null,
            published_at: r.createTime,
            response_text: r.reviewReply?.comment ?? null,
            response_published_at: r.reviewReply?.updateTime ?? null,
          }))

          await db
            .from('reviews')
            .upsert(reviewPayloads, { onConflict: 'review_id', ignoreDuplicates: true })
        }

        // Atualiza gbp_location_id na organização (so se nao estava definido)
        if (!existingLocationId) {
          await db
            .from('organizations')
            .update({ gbp_location_id: locationName })
            .eq('id', orgId)
        }

        // Executa auditoria via Claude
        const auditReport = await runAudit({
          location,
          reviews: reviewList,
          media: mediaList,
          specialty,
        })

        // Persiste relatório de auditoria no perfil GBP
        await db
          .from('gbp_profiles')
          .update({ audit_report: auditReport })
          .eq('organization_id', orgId)
          .eq('location_id', locationName)

        // Analise competitiva: enriquecer keywords + gerar gaps
        try {
          // Buscar gmb_profile id para FK de competitors
          const { data: gmbProfile } = await db
            .from('gmb_profiles')
            .select('id, categories, description, photo_count, services')
            .eq('organization_id', orgId)
            .eq('location_id', locationName)
            .maybeSingle()

          if (gmbProfile) {
            // Enriquecer concorrentes com keywords dos reviews
            await enrichCompetitorKeywords(db, gmbProfile.id)

            // Buscar concorrentes enriquecidos
            const { data: competitors } = await db
              .from('competitors')
              .select('place_id, name, categories, avg_rating, review_count, photo_count, has_website, description, review_keywords')
              .eq('profile_id', gmbProfile.id)

            if (competitors && competitors.length > 0) {
              const compProfiles: CompetitorProfile[] = competitors.map(c => ({
                place_id: c.place_id,
                name: c.name,
                categories: c.categories ?? [],
                avg_rating: c.avg_rating,
                review_count: c.review_count ?? 0,
                photo_count: c.photo_count ?? 0,
                has_website: c.has_website ?? false,
                description: c.description,
                review_keywords: (c.review_keywords as string[]) ?? [],
              }))

              const analysisResult = await analyzeCompetitivePosition(
                {
                  categories: (gmbProfile.categories as string[]) ?? [],
                  description: gmbProfile.description as string | null,
                  photo_count: (gmbProfile.photo_count as number) ?? 0,
                  review_count: reviewList.length,
                  avg_rating: reviewList.length > 0
                    ? reviewList.reduce((sum: number, r: { starRating: string }) => sum + GBPClient.starRatingToNumber(r.starRating), 0) / reviewList.length
                    : null,
                  services: (gmbProfile.services as Array<{ displayName?: string }>) ?? [],
                },
                compProfiles
              )

              await saveCompetitiveAnalysis(db, orgId, analysisResult)
              console.log(`[gbp-audit] competitive analysis saved for org ${orgId}: ${analysisResult.gaps.length} gaps`)
            }
          }
        } catch (err) {
          console.error('[gbp-audit] competitive analysis error:', err instanceof Error ? err.message : err)
        }

        // Dispara otimizador + score calculator apos auditoria concluida
        await inngest.send([
          { name: 'destaka/gbp.optimize.requested', data: { organization_id: orgId } },
          { name: 'destaka/score.calculate.requested', data: { organization_id: orgId } },
        ])

        return { org_id: orgId, status: 'ok', gaps: auditReport.gaps.length }
      })

      results.push(result as { org_id: string; status: string; error?: string })
    }

    return { processed: results.length, results }
  }
)
