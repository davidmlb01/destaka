import { cron } from 'inngest'
import { inngest } from '../client'

export const postGenerator = inngest.createFunction(
  { id: 'post-generator', triggers: [cron('0 10 * * 1,3,5')] },
  async ({ event, step }) => {
    // TODO Story 005: geracao e publicacao automatica de posts GBP
    return { status: 'not_implemented' }
  }
)
