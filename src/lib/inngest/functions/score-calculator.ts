import { cron } from 'inngest'
import { inngest } from '../client'

export const scoreCalculator = inngest.createFunction(
  { id: 'score-calculator', triggers: [cron('0 3 * * *')] },
  async ({ event, step }) => {
    // TODO Story 007: calculo diario do Score Destaka (5 componentes, 0-100)
    return { status: 'not_implemented' }
  }
)
