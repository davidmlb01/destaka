import { createServiceClient } from '@/lib/supabase/server'
import { decrypt, encrypt } from '@/lib/crypto'

/**
 * Retorna um access token válido para o usuário.
 * Se o token atual estiver expirado, usa o refresh token para obter um novo
 * e salva no banco automaticamente.
 *
 * Lança erro se o usuário precisar reconectar manualmente.
 */
export async function getValidGmbToken(userId: string): Promise<string> {
  const serviceClient = await createServiceClient()
  const { data: userData } = await serviceClient
    .from('users')
    .select('google_access_token_enc, google_refresh_token_enc')
    .eq('id', userId)
    .single()

  if (!userData?.google_access_token_enc) {
    throw new Error('Token Google não encontrado. Reconecte sua conta.')
  }

  const accessToken = decrypt(userData.google_access_token_enc)

  // Valida o token com o endpoint do Google (leve, não consome quota de API)
  const tokenInfoController = new AbortController()
  const tokenInfoTimeout = setTimeout(() => tokenInfoController.abort(), 10000)
  let tokenInfo: Response
  try {
    tokenInfo = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
      { signal: tokenInfoController.signal }
    )
  } finally {
    clearTimeout(tokenInfoTimeout)
  }

  if (tokenInfo.ok) return accessToken

  // Token expirado — tenta renovar com o refresh token
  if (!userData.google_refresh_token_enc) {
    throw new Error('Sessão expirada. O usuário precisa reconectar a conta Google.')
  }

  const refreshToken = decrypt(userData.google_refresh_token_enc)

  const refreshController = new AbortController()
  const refreshTimeout = setTimeout(() => refreshController.abort(), 10000)
  let refreshRes: Response
  try {
    refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: refreshController.signal,
    })
  } finally {
    clearTimeout(refreshTimeout)
  }

  if (!refreshRes.ok) {
    const err = await refreshRes.text()
    console.error('[gmb/auth] Falha ao renovar token Google:', err)
    throw new Error('Sessão expirada. O usuário precisa reconectar a conta Google.')
  }

  const refreshData = await refreshRes.json() as { access_token?: string }
  if (!refreshData.access_token) {
    throw new Error('Resposta inválida ao renovar token Google.')
  }
  const newToken = refreshData.access_token

  // Salva o novo token criptografado
  await serviceClient
    .from('users')
    .update({ google_access_token_enc: encrypt(newToken) })
    .eq('id', userId)

  return newToken
}
