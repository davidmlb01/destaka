// Story 002: GBP Audit Engine — importação e auditoria do perfil Google Business Profile
// Disparado por evento (onboarding/re-import) ou cron semanal (toda segunda, 9h)

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { GBPClient } from '@/lib/google/gbp-client'
import { runAudit } from '@/lib/gbp/audit-engine'

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
        // Busca token
        const { data: tokenRow } = await db
          .from('google_tokens')
          .select('access_token, refresh_token')
          .eq('organization_id', orgId)
          .single()

        if (!tokenRow?.access_token) {
          return { org_id: orgId, status: 'skip', error: 'sem token Google' }
        }

        // Busca specialty da organização para contexto do audit
        const { data: org } = await db
          .from('organizations')
          .select('specialty')
          .eq('id', orgId)
          .single()

        const specialty = org?.specialty ?? 'outro'

        // Inicializa cliente GBP e busca dados
        const gbp = new GBPClient(tokenRow.access_token)

        let accounts: Awaited<ReturnType<GBPClient['listAccounts']>> = []
        try {
          accounts = await gbp.listAccounts()
        } catch {
          return { org_id: orgId, status: 'error', error: 'falha ao listar accounts GBP' }
        }

        if (accounts.length === 0) {
          return { org_id: orgId, status: 'skip', error: 'nenhuma conta GBP encontrada' }
        }

        const accountName = accounts[0].name

        let locations: Awaited<ReturnType<GBPClient['listLocations']>> = []
        try {
          locations = await gbp.listLocations(accountName)
        } catch {
          return { org_id: orgId, status: 'error', error: 'falha ao listar locations GBP' }
        }

        if (locations.length === 0) {
          return { org_id: orgId, status: 'skip', error: 'nenhuma location GBP encontrada' }
        }

        const location = locations[0]
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

        // Atualiza gbp_location_id na organização
        await db
          .from('organizations')
          .update({ gbp_location_id: locationName })
          .eq('id', orgId)

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

        // Dispara otimizador (Story 006) após auditoria concluída
        await inngest.send({
          name: 'destaka/gbp.optimize.requested',
          data: { organization_id: orgId },
        })

        return { org_id: orgId, status: 'ok', gaps: auditReport.gaps.length }
      })

      results.push(result as { org_id: string; status: string; error?: string })
    }

    return { processed: results.length, results }
  }
)
