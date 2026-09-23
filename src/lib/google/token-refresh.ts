// Token refresh unificado para cron jobs E user routes
// Fonte unica de verdade: tabela google_tokens (encrypted)
// Valida access_token via Google tokeninfo, renova com refresh_token se expirado
// Optimistic concurrency: so atualiza se o token no banco ainda e o mesmo que foi lido

import type { SupabaseClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/lib/crypto'

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

  // Decrypt tokens
  let accessToken: string
  let refreshToken: string | null
  try {
    accessToken = decrypt(tokenRow.access_token)
    refreshToken = tokenRow.refresh_token ? decrypt(tokenRow.refresh_token) : null
  } catch {
    // Tokens ainda em plaintext (migracao pendente): usar direto
    accessToken = tokenRow.access_token
    refreshToken = tokenRow.refresh_token
  }

  // Valida token atual
  const tokenInfo = await fetch(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
    { signal: AbortSignal.timeout(10000) }
  ).catch(() => null)

  if (tokenInfo?.ok) return accessToken

  // Token expirado: tentar refresh
  if (!refreshToken) return null

  const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null)

  if (!refreshRes?.ok) {
    const errBody = await refreshRes?.text().catch(() => 'unknown')
    console.error(`[token-refresh] Falha ao renovar token para org ${orgId}:`, errBody)
    return null
  }

  const data = await refreshRes.json() as { access_token?: string }
  if (!data.access_token) return null

  // Optimistic concurrency: so atualiza se o token no banco nao mudou
  // (evita race condition com outro processo que ja fez refresh)
  const { error: updateError } = await db
    .from('google_tokens')
    .update({ access_token: encrypt(data.access_token) })
    .eq('organization_id', orgId)
    .eq('access_token', tokenRow.access_token)

  if (updateError) {
    console.error(`[token-refresh] Falha ao salvar token para org ${orgId}:`, updateError.message)
  }

  return data.access_token
}
