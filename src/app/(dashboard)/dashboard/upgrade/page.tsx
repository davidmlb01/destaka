import { Suspense } from 'react'
import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { UpgradeContent } from './UpgradeContent'

export const dynamic = 'force-dynamic'

export default async function UpgradePage() {
  const ctx = await getDashboardContext()
  return (
    <Suspense>
      <UpgradeContent specialty={ctx.specialty} />
    </Suspense>
  )
}
