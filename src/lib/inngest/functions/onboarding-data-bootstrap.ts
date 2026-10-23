// Onboarding Data Bootstrap
// Dispara TODOS os collectors imediatamente quando o usuario assina.
// Sem isso, o usuario so veria dados apos o proximo cron (dias depois).
// Trigger: destaka/subscription.activated (mesmo evento dos emails)

import { inngest } from '../client'

interface SubscriptionData {
  organization_id: string
  user_email: string
}

export const onboardingDataBootstrap = inngest.createFunction(
  {
    id: 'onboarding-data-bootstrap',
    triggers: [{ event: 'destaka/subscription.activated' }],
  },
  async ({ event, step }) => {
    const { organization_id } = event.data as SubscriptionData

    // Fan-out: dispara todos os collectors em paralelo
    // O gbp-audit e o mais importante: ele cascata para optimizer + score
    await step.run('dispatch-all-collectors', async () => {
      await inngest.send([
        { name: 'destaka/gbp.audit.requested', data: { organization_id } },
        { name: 'destaka/competitors.discover.requested', data: { organization_id } },
        { name: 'destaka/reviews.sync.requested', data: { organization_id } },
        { name: 'destaka/geo.collect.requested', data: { organization_id } },
        { name: 'destaka/performance.collect.requested', data: { organization_id } },
        { name: 'destaka/keywords.snapshot.requested', data: { organization_id } },
      ])
    })

    return {
      organization_id,
      events_dispatched: 6,
      status: 'all-collectors-triggered',
    }
  }
)
