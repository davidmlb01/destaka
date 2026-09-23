// Token refresh para user routes (dashboard, approve, optimize)
// Delega para getValidTokenForOrg (fonte unica de verdade)
// Resolve user_id -> organization_id -> token

import { createServiceClient } from '@/lib/supabase/server'
import { sendTokenReconnectEmail } from '@/lib/email/token-reconnect'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'

/**
 * Retorna um access token valido para o usuario autenticado.
 * Resolve user -> professional -> organization -> google_tokens.
 * Lanca erro se o usuario precisar reconectar manualmente.
 */
export async function getValidGmbToken(userId: string): Promise<string> {
  const serviceClient = await createServiceClient()

  // Resolve user -> organization
  const { data: professional } = await serviceClient
    .from('professionals')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!professional?.organization_id) {
    throw new Error('Organizacao nao encontrada. Complete o onboarding.')
  }

  const token = await getValidTokenForOrg(serviceClient, professional.organization_id)

  if (token) return token

  // Token invalido: sinalizar e notificar
  try {
    const { data: userForNotif } = await serviceClient
      .from('users')
      .select('email, name, gmb_token_invalid')
      .eq('id', userId)
      .single()

    if (userForNotif && !userForNotif.gmb_token_invalid) {
      await serviceClient
        .from('users')
        .update({ gmb_token_invalid: true })
        .eq('id', userId)

      if (userForNotif.email) {
        sendTokenReconnectEmail({
          to: userForNotif.email,
          name: userForNotif.name ?? userForNotif.email,
        }).catch(() => { /* falha silenciosa no email */ })
      }
    }
  } catch {
    // Falha ao sinalizar: nao bloqueia o erro principal
  }

  throw new Error('Sessao expirada. Reconecte sua conta Google.')
}
