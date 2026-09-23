// Token refresh para cron jobs (Inngest)
// Valida access_token via Google tokeninfo, renova com refresh_token se expirado
// Atualiza google_tokens automaticamente

import type { SupabaseClient } from '@supabase/supabase-js'

export async function getValidTokenForOrg(
  db: SupabaseClient,
  orgId: string
): Promise<string | null> {
  const { data: tokenRow } = await db
    .from('google_tokens')
    .select('access_token, refresh_token')
    .eq('organization_id', orgId)
    .single()

  if (!tokenRow?.access_token) return null

  // Valida token atual
  const tokenInfo = await fetch(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${tokenRow.access_token}`,
    { signal: AbortSignal.timeout(10000) }
  ).catch(() => null)

  if (tokenInfo?.ok) return tokenRow.access_token

  // Token expirado: tentar refresh
  if (!tokenRow.refresh_token) return null

  const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokenRow.refresh_token,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null)

  if (!refreshRes?.ok) {
    console.error(`[token-refresh] Falha ao renovar token para org ${orgId}`)
    return null
  }

  const data = await refreshRes.json() as { access_token?: string }
  if (!data.access_token) return null

  // Atualiza token no banco
  await db
    .from('google_tokens')
    .update({ access_token: data.access_token })
    .eq('organization_id', orgId)

  return data.access_token
}
