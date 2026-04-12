import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { gbpAudit } from '@/lib/inngest/functions/gbp-audit'
import { reviewMonitor } from '@/lib/inngest/functions/review-monitor'
import { postGenerator } from '@/lib/inngest/functions/post-generator'
import { scoreCalculator } from '@/lib/inngest/functions/score-calculator'
import { monthlyReport } from '@/lib/inngest/functions/monthly-report'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    gbpAudit,
    reviewMonitor,
    postGenerator,
    scoreCalculator,
    monthlyReport,
  ],
})
