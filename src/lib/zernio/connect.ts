import { getOrCreateProfile, getZernioAccountId, probeAnalytics } from './client'

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

    // Probe automatico: testa se Zernio retorna analytics apos conexao
    if (accountId) {
      console.log(`[zernio] Account conectado para org ${orgId}. Testando analytics...`)
      const probe = await probeAnalytics(accountId)
      console.log(`[zernio-analytics-probe] Org ${orgId}: available=${probe.available}`)
      if (probe.available) {
        console.log(`[zernio-analytics-probe] SUCESSO: Zernio retorna analytics para org ${orgId}. Dados:`, JSON.stringify(probe.raw).slice(0, 1000))
      } else {
        console.warn(`[zernio-analytics-probe] Zernio NAO retorna analytics para org ${orgId}. Investigar alternativas de performance metrics.`)
      }
    }
  } catch (err) {
    console.error('[zernio] ensureZernioProfile failed:', err)
  }
}
