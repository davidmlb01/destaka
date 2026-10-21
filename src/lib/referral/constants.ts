// Mapeamento de cupons do programa de indicacao
// IDs correspondem aos cupons criados no Stripe

// Cupons para o INDICADO (quem chega pelo codigo)
export const REFERRAL_COUPONS_INDICADO = {
  '20_forever': 'REF_INDICADO_20',       // 20% permanente
  '50_first_month': 'REF_INDICADO_50_1M', // 50% no 1o mes
} as const

// Cupons escalonados para o INDICADOR (quem indica)
// Webhook troca automaticamente conforme numero de indicados ativos
export const REFERRAL_COUPONS_INDICADOR: Record<number, string> = {
  1: 'REF_INDICADOR_20',  // 1 indicado ativo = 20%
  2: 'REF_INDICADOR_40',  // 2 indicados ativos = 40%
  3: 'REF_INDICADOR_60',  // 3 indicados ativos = 60%
  4: 'REF_INDICADOR_80',  // 4 indicados ativos = 80%
  5: 'REF_INDICADOR_100', // 5+ indicados ativos = 100% (nunca mais paga)
}

// Retorna o cupom correto para o numero de indicados ativos
export function getCouponForActiveReferrals(count: number): string | null {
  if (count <= 0) return null
  const capped = Math.min(count, 5)
  return REFERRAL_COUPONS_INDICADOR[capped] ?? null
}

// Config
export const REFERRAL_COOKIE_NAME = 'destaka_ref'
export const REFERRAL_COOKIE_MAX_AGE = 90 * 24 * 60 * 60 // 90 dias em segundos
export const REFERRAL_TRIGGER_INVOICE = 2 // 2a mensalidade paga ativa o indicado
export const PARTNER_COMMISSION_RATE = 0.30 // 30% sobre valor pago
export const PARTNER_COMMISSION_MONTHS = 3 // Comissao nas 3 primeiras mensalidades
