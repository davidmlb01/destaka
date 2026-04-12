import { cron } from 'inngest'
import { inngest } from '../client'

export const reviewMonitor = inngest.createFunction(
  { id: 'review-monitor', triggers: [cron('0 */6 * * *')] },
  async ({ event, step }) => {
    // TODO Story 004: monitoramento e resposta automatica de reviews
    return { status: 'not_implemented' }
  }
)
