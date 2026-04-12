// Story 008: Relatório Mensal — compila dados 30 dias e envia por email via Resend
// Cron: dia 1 de cada mês às 8h

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { resend } from '@/lib/resend/client'
import { compileMonthlyReport } from '@/lib/report/report-compiler'
import { buildMonthlyReportEmail } from '@/lib/resend/templates/monthly-report'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const monthlyReport = inngest.createFunction(
  {
    id: 'monthly-report',
    triggers: [
      { cron: '0 8 1 * *' },
      { event: 'destaka/report.monthly.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      if (event.name === 'destaka/report.monthly.requested') {
        return [(event as unknown as { data: { organization_id: string } }).data.organization_id]
      }
      const { data } = await db.from('organizations').select('id')
      return (data ?? []).map((r: { id: string }) => r.id)
    })

    const results: Array<{ org_id: string; status: string; email?: string; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`send-report-${orgId}`, async () => {
        const reportData = await compileMonthlyReport(db, orgId)

        if (!reportData) {
          return { org_id: orgId, status: 'skip', error: 'dados insuficientes para compilar relatório' }
        }

        const { subject, html } = buildMonthlyReportEmail(reportData)

        const { data: sent, error } = await resend.emails.send({
          from: 'Destaka <relatorio@destaka.com.br>',
          to: reportData.professional_email,
          subject,
          html,
        })

        if (error) {
          // Persiste tentativa com erro para reenvio manual
          await db.from('reports').upsert({
            organization_id: orgId,
            month: reportData.month,
            year: reportData.year,
            data: reportData,
            email_status: `error: ${error.message}`,
          }, { onConflict: 'organization_id,month,year' })

          return { org_id: orgId, status: 'error', error: error.message }
        }

        // Persiste relatório enviado
        await db.from('reports').upsert({
          organization_id: orgId,
          month: reportData.month,
          year: reportData.year,
          data: reportData,
          sent_at: new Date().toISOString(),
          email_status: `sent:${sent?.id ?? 'ok'}`,
        }, { onConflict: 'organization_id,month,year' })

        return {
          org_id: orgId,
          status: 'sent',
          email: reportData.professional_email,
        }
      })

      results.push(result as { org_id: string; status: string; email?: string; error?: string })
    }

    return { processed: results.length, results }
  }
)
