// Story 007: Score Destaka — cálculo diário e snapshot no banco
// Cron: todo dia às 3h da manhã

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { calculateScore, buildScoreInput } from '@/lib/score/score-calculator'

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
      if (event.name === 'destaka/score.calculate.requested') {
        return [(event as unknown as { data: { organization_id: string } }).data.organization_id]
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
          .select('description, categories, attributes, photo_count, hours')
          .eq('organization_id', orgId)
          .single()

        if (!profile) {
          return { org_id: orgId, error: 'perfil GBP não encontrado' }
        }

        // Busca reviews
        const today = new Date()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: reviews } = await db
          .from('reviews')
          .select('rating, published_at')
          .eq('organization_id', orgId)

        const reviewList = reviews ?? []
        const reviewCount = reviewList.length
        const avgRating = reviewCount > 0
          ? reviewList.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewCount
          : 0

        const reviewsLast30Days = reviewList.filter((r: { published_at: string }) => {
          if (!r.published_at) return false
          return new Date(r.published_at) >= thirtyDaysAgo
        }).length

        // Taxa de resposta
        const { data: responses } = await db
          .from('review_responses')
          .select('review_id')
          .eq('organization_id', orgId)
          .eq('status', 'published')

        const responseRate = reviewCount > 0
          ? (responses?.length ?? 0) / reviewCount
          : 0

        // Posts recentes (últimos 30 dias)
        const { data: recentPosts } = await db
          .from('posts')
          .select('id')
          .eq('organization_id', orgId)
          .eq('status', 'published')
          .gte('published_at', thirtyDaysAgo.toISOString())

        const recentPostCount = recentPosts?.length ?? 0

        // Histórico de scores para calcular tendência
        const { data: previousSnapshots } = await db
          .from('scores')
          .select('total')
          .eq('organization_id', orgId)
          .order('snapshot_date', { ascending: false })
          .limit(7)

        const previousScores = (previousSnapshots ?? []).map((s: { total: number }) => s.total).reverse()

        // Calcula score
        const input = buildScoreInput({
          profile,
          reviewCount,
          avgRating,
          responseRate,
          reviewsLast30Days,
          recentPostCount,
        })

        const breakdown = calculateScore(input, previousScores)

        // Persiste snapshot (upsert para evitar duplicatas no mesmo dia)
        const snapshotDate = today.toISOString().split('T')[0]

        await db.from('scores').upsert({
          organization_id: orgId,
          total: breakdown.total,
          gmb_completude: breakdown.gmb_completude,
          reputacao: breakdown.reputacao,
          visibilidade: breakdown.visibilidade,
          retencao: breakdown.retencao,
          conversao: breakdown.conversao,
          faixa: breakdown.faixa,
          tendencia: breakdown.tendencia,
          snapshot_date: snapshotDate,
        }, { onConflict: 'organization_id,snapshot_date' })

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
