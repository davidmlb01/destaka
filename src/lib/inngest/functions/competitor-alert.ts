// Story 5.4: Alertas de Movimento dos Concorrentes
// Roda toda segunda após o competitor-monitor (cron 8am UTC)
// Compara snapshots da semana atual vs anterior e envia email se concorrente ganhou 5+ reviews

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { sendCompetitorAlert } from '@/lib/email/competitor-alert'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const REVIEW_THRESHOLD = 5

export const competitorAlert = inngest.createFunction(
  {
    id: 'competitor-alert',
    triggers: [
      { cron: '0 9 * * 1' }, // Segunda 9am UTC (após competitor-monitor às 6am)
    ],
  },
  async ({ step }) => {
    const db = admin()

    const orgs = await step.run('get-orgs', async () => {
      const { data } = await db
        .from('organizations')
        .select('id, name, specialty, owner_email:professionals!inner(user_id, users:auth_users(email))')

      // Extrair email do owner via join
      return (data ?? []).map((o: Record<string, unknown>) => {
        const profs = o.professionals as Array<{ users: { email: string } | null }> | undefined
        const email = profs?.[0]?.users?.email ?? null
        return { id: o.id as string, name: o.name as string, specialty: (o.specialty as string | null) ?? null, email }
      }).filter(o => o.email)
    })

    // Fallback: buscar emails diretamente se o join complexo não funcionar
    const orgList = await step.run('resolve-emails', async () => {
      const results: { id: string; name: string; specialty: string | null; email: string }[] = []

      for (const org of orgs) {
        if (org.email) {
          results.push({ id: org.id, name: org.name, specialty: org.specialty, email: org.email })
          continue
        }
        // Fallback: buscar via professionals -> auth.users
        const { data: prof } = await db
          .from('professionals')
          .select('user_id')
          .eq('organization_id', org.id)
          .limit(1)
          .maybeSingle()

        if (prof?.user_id) {
          const { data: authUser } = await db.auth.admin.getUserById(prof.user_id)
          if (authUser?.user?.email) {
            results.push({ id: org.id, name: org.name, specialty: org.specialty, email: authUser.user.email })
          }
        }
      }
      return results
    })

    let alertsSent = 0

    for (const org of orgList) {
      await step.run(`check-alerts-${org.id}`, async () => {
        // Buscar snapshots das últimas 2 semanas
        const twoWeeksAgo = new Date()
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

        const { data: snapshots } = await db
          .from('competitor_snapshots')
          .select('name, review_count, snapshot_date, is_self')
          .eq('organization_id', org.id)
          .gte('snapshot_date', twoWeeksAgo.toISOString().slice(0, 10))
          .order('snapshot_date', { ascending: true })

        if (!snapshots || snapshots.length < 2) return

        // Separar por nome e pegar primeiro/último snapshot
        const byName = new Map<string, { first: number; last: number; isSelf: boolean }>()

        for (const s of snapshots) {
          const existing = byName.get(s.name)
          if (!existing) {
            byName.set(s.name, { first: s.review_count, last: s.review_count, isSelf: s.is_self })
          } else {
            existing.last = s.review_count
          }
        }

        // Encontrar dados do próprio usuário
        let userGain = 0
        let userReviews = 0
        for (const [, v] of byName) {
          if (v.isSelf) {
            userGain = v.last - v.first
            userReviews = v.last
            break
          }
        }

        // Verificar concorrentes que ganharam 5+ reviews
        for (const [name, v] of byName) {
          if (v.isSelf) continue
          const gain = v.last - v.first
          if (gain >= REVIEW_THRESHOLD) {
            await sendCompetitorAlert({
              to: org.email,
              orgName: org.name,
              competitorName: name,
              competitorReviews: v.last,
              competitorGain: gain,
              userReviews,
              userGain,
              dashboardUrl: 'https://destaka.com.br/dashboard/competitors',
              specialty: org.specialty,
            })
            alertsSent++
          }
        }
      })
    }

    return { alertsSent, orgsChecked: orgList.length }
  }
)
