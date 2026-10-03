import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { gbpAudit } from '@/lib/inngest/functions/gbp-audit'
import { gbpOptimizer } from '@/lib/inngest/functions/gbp-optimizer'
import { competitorMonitor } from '@/lib/inngest/functions/competitor-monitor'
import { reviewMonitor } from '@/lib/inngest/functions/review-monitor'
import { postGenerator } from '@/lib/inngest/functions/post-generator'
import { scoreCalculator } from '@/lib/inngest/functions/score-calculator'
import { monthlyReport } from '@/lib/inngest/functions/monthly-report'
import { instagramSync } from '@/lib/inngest/functions/instagram-sync'
import { onboardingWhatsappSequence } from '@/lib/inngest/functions/onboarding-whatsapp-sequence'
import { onboardingEmailSequence } from '@/lib/inngest/functions/onboarding-email-sequence'
import { geoCollector } from '@/lib/inngest/functions/geo-collector'
import { keywordSnapshot } from '@/lib/inngest/functions/keyword-snapshot'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    gbpAudit,
    gbpOptimizer,
    competitorMonitor,
    reviewMonitor,
    postGenerator,
    scoreCalculator,
    monthlyReport,
    instagramSync,
    onboardingWhatsappSequence,
    onboardingEmailSequence,
    geoCollector,
    keywordSnapshot,
  ],
})
