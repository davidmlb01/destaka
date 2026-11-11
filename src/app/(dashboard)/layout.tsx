export const dynamic = 'force-dynamic'

import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getDashboardContext()

  return (
    <DashboardLayout
      profileName={ctx.profileName}
      userEmail={ctx.user.email}
      isSubscriber={ctx.isSubscriber}
      specialty={ctx.specialty}
    >
      {children}
    </DashboardLayout>
  )
}
