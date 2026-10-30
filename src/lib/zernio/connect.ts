import { getOrCreateProfile, getZernioAccountId } from './client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = { from: (...args: any[]) => any }

export async function ensureZernioProfile(
  orgId: string,
  orgName: string,
  db: AnySupabaseClient
): Promise<void> {
  try {
    const { data: org } = await db
      .from('organizations')
      .select('zernio_profile_id, zernio_account_id')
      .eq('id', orgId)
      .maybeSingle() as { data: { zernio_profile_id?: string; zernio_account_id?: string } | null }

    if (org?.zernio_account_id) return

    const profileId = org?.zernio_profile_id ?? await getOrCreateProfile(orgId, orgName)
    const accountId = await getZernioAccountId(profileId)

    await db.from('organizations').update({
      zernio_profile_id: profileId,
      ...(accountId ? { zernio_account_id: accountId } : {}),
    }).eq('id', orgId)
  } catch (err) {
    console.error('[zernio] ensureZernioProfile failed:', err)
  }
}
