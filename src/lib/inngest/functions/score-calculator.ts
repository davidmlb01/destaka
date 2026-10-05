// Story 007: Score Destaka — cálculo diário e snapshot no banco
// Cron: todo dia às 3h da manhã

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { calculateScore, buildScoreInput, toLegacyBreakdown } from '@/lib/score/score-calculator'
import { getActivePlan, updatePlanProgress, updatePlanInDb } from '@/lib/plan/plan-generator'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const scoreCalculator = inngest.createFunction(
  {
    id: 'score-calculator',
    triggers: [
      { cron: '0 3 * * *' },
      { event: 'destaka/score.calculate.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const eventData = (event as unknown as { data?: { organization_id?: string } }).data
      if (event.name === 'destaka/score.calculate.requested' && eventData?.organization_id) {
        return [eventData.organization_id]
      }
      const { data } = await db.from('organizations').select('id')
      return (data ?? []).map((r: { id: string }) => r.id)
    })

    const results: Array<{ org_id: string; score?: number; faixa?: string; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`calc-score-${orgId}`, async () => {
        // Busca perfil GBP
        const { data: profile } = await db
          .from('gbp_profiles')
          .select('description, categories, attributes, photo_count, hours, website')
          .eq('organization_id', orgId)
          .single()

        if (!profile) {
          return { org_id: orgId, error: 'perfil GBP nao encontrado' }
        }

        // Busca reviews
        const today = new Date()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const [
          { data: reviews },
          { data: responses },
          { data: recentPosts },
          { data: previousSnapshots },
          { data: geoSnapshot },
          { data: keywordRows },
        ] = await Promise.all([
          db.from('reviews').select('rating, published_at').eq('organization_id', orgId),
          db.from('review_responses').select('review_id').eq('organization_id', orgId).eq('status', 'published'),
          db.from('posts').select('id').eq('organization_id', orgId).eq('status', 'published').gte('published_at', thirtyDaysAgo.toISOString()),
          db.from('scores').select('total').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(7),
          db.from('geo_snapshots').select('regions').eq('org_id', orgId).order('week_start', { ascending: false }).limit(1).maybeSingle(),
          db.from('keyword_snapshots').select('impressions, week_start').eq('org_id', orgId).order('week_start', { ascending: false }).limit(50),
        ])

        const reviewList = reviews ?? []
        const reviewCount = reviewList.length
        const avgRating = reviewCount > 0
          ? reviewList.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewCount
          : 0

        const reviewsLast30Days = reviewList.filter((r: { published_at: string }) => {
          if (!r.published_at) return false
          return new Date(r.published_at) >= thirtyDaysAgo
        }).length

        const responseRate = reviewCount > 0
          ? (responses?.length ?? 0) / reviewCount
          : 0

        const recentPostCount = recentPosts?.length ?? 0
        const previousScores = (previousSnapshots ?? []).map((s: { total: number }) => s.total).reverse()

        // Dados geograficos do snapshot mais recente
        const regions = (geoSnapshot?.regions ?? []) as Array<{ status: string }>
        const geoTotalZones = regions.length
        const geoStrongZones = regions.filter(r => r.status === 'strong').length

        // Keywords: soma de impressoes da semana mais recente
        const kwList = keywordRows ?? []
        const currentWeek = kwList[0]?.week_start ?? null
        const currentWeekKws = currentWeek ? kwList.filter((k: { week_start: string }) => k.week_start === currentWeek) : []
        const totalImpressions = currentWeekKws.reduce((sum: number, k: { impressions: number }) => sum + (k.impressions ?? 0), 0)

        // Calcula score
        const input = buildScoreInput({
          profile,
          reviewCount,
          avgRating,
          responseRate,
          reviewsLast30Days,
          recentPostCount,
          geoStrongZones,
          geoTotalZones,
          totalImpressions,
        })

        const breakdown = calculateScore(input, previousScores)
        const legacy = toLegacyBreakdown(breakdown)

        // Persiste snapshot (upsert para evitar duplicatas no mesmo dia)
        const snapshotDate = today.toISOString().split('T')[0]

        await db.from('scores').upsert({
          organization_id: orgId,
          total: legacy.total,
          projected_score: legacy.projected_score,
          gmb_completude: legacy.gmb_completude,
          reputacao: legacy.reputacao,
          visibilidade: legacy.visibilidade,
          retencao: legacy.retencao,
          conversao: legacy.conversao,
          faixa: legacy.faixa,
          tendencia: legacy.tendencia,
          snapshot_date: snapshotDate,
        }, { onConflict: 'organization_id,snapshot_date' })

        // Atualizar plano de superacao (se existir)
        try {
          const activePlan = await getActivePlan(db, orgId)
          if (activePlan) {
            const planCtx = {
              hasDescription: input.hasDescription,
              categoryCount: input.categoryCount,
              attributeCount: input.attributeCount,
              photoCount: input.photoCount,
              hasHours: input.hasHours,
              recentPostCount: input.recentPostCount,
              reviewCount: input.reviewCount,
              avgRating: input.avgRating,
              reviewResponseRate: input.reviewResponseRate,
              hasWebsite: input.hasWebsite,
              totalScore: breakdown.total,
            }
            const { updated, plan: updatedPlan } = updatePlanProgress(activePlan, planCtx)
            if (updated) {
              await updatePlanInDb(db, updatedPlan)
              console.log(`[score-calculator] surpass plan updated for org ${orgId}: ${updatedPlan.steps.filter(s => s.status === 'done').length}/${updatedPlan.steps.length} done`)
            }
          }
        } catch (err) {
          console.error('[score-calculator] surpass plan update error:', err instanceof Error ? err.message : err)
        }

        return {
          org_id: orgId,
          score: breakdown.total,
          faixa: breakdown.faixa,
        }
      })

      results.push(result as { org_id: string; score?: number; faixa?: string; error?: string })
    }

    return { processed: results.length, results }
  }
)
