import { cron } from 'inngest'
import { inngest } from '../client'

export const monthlyReport = inngest.createFunction(
  { id: 'monthly-report', triggers: [cron('0 8 1 * *')] },
  async ({ event, step }) => {
    // TODO Story 008: compilar metricas 30 dias e enviar relatorio por email via Resend
    return { status: 'not_implemented' }
  }
)
