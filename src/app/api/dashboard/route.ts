export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { getDashboardData } from '@/lib/dashboard/get-dashboard-data'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth

  const data = await getDashboardData(orgId)
  return privateJson(data)
}
