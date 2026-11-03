import { timingSafeEqual, createHmac } from 'crypto'

/**
 * Comparacao timing-safe para admin keys.
 * Previne ataques de timing que inferem caracteres corretos pela diferenca de tempo de resposta.
 */
export function verifyAdminKey(provided: string | null): boolean {
  const expected = process.env.ADMIN_SECRET_KEY
  if (!provided || !expected) return false
  const ha = createHmac('sha256', 'destaka-admin').update(provided).digest()
  const hb = createHmac('sha256', 'destaka-admin').update(expected).digest()
  return timingSafeEqual(ha, hb)
}
