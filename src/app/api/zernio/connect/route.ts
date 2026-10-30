export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthOrg } from '@/lib/api/with-auth'
import { getOrCreateProfile, generateConnectUrl, getZernioAccountId } from '@/lib/zernio/client'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  const { data: org } = await supabase
    .from('organizations')
    .select('name, zernio_profile_id, zernio_account_id')
    .eq('id', orgId)
    .maybeSingle()

  if (org?.zernio_account_id) {
    return NextResponse.json({ connected: true, accountId: org.zernio_account_id })
  }

  const profileId = org?.zernio_profile_id ?? await getOrCreateProfile(orgId, org?.name ?? 'Business')

  const accountId = await getZernioAccountId(profileId)
  if (accountId) {
    const admin = createAdminSupa(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin
      .from('organizations')
      .update({ zernio_profile_id: profileId, zernio_account_id: accountId })
      .eq('id', orgId)
    return NextResponse.json({ connected: true, accountId })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'
  const connectUrl = await generateConnectUrl(profileId, `${appUrl}/api/zernio/callback`)

  return NextResponse.json({ connected: false, connectUrl })
}
