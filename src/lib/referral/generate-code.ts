import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Gera um codigo de indicacao a partir do nome do profissional.
 * Ex.: "Dra. Ana Oliveira" -> "DRANA"
 * Se ja existir, tenta DRANA2, DRANA3, etc.
 */
function normalizeToCode(name: string): string {
  // Remove titulos comuns
  const cleaned = name
    .replace(/^(dr\.?|dra\.?|prof\.?)\s*/i, '')
    .trim()

  // Pega primeira silaba do primeiro nome (max 4 chars) + primeiro nome sem acentos
  const parts = cleaned.split(/\s+/)
  const firstName = parts[0] ?? 'USER'

  // Remove acentos
  const normalized = firstName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')

  // Prefixo DR se o nome original tinha titulo
  const hasTitle = /^(dr\.?|dra\.?)/i.test(name)
  const prefix = hasTitle ? 'DR' : ''

  const base = prefix + normalized
  return base.slice(0, 8) || 'REF' // max 8 chars para ficar curto
}

/**
 * Cria codigo de indicacao para um cliente.
 * Garante unicidade no banco.
 * Retorna o codigo criado ou null se falhar.
 */
export async function createClientReferralCode(
  userId: string,
  userName: string
): Promise<string | null> {
  const admin = getAdmin()
  const baseCode = normalizeToCode(userName)

  // Tentar ate 10 variantes
  for (let i = 0; i < 10; i++) {
    const code = i === 0 ? baseCode : `${baseCode}${i + 1}`

    const { error } = await admin
      .from('referral_codes')
      .insert({
        code,
        owner_type: 'client',
        owner_user_id: userId,
        active: true,
      })

    if (!error) {
      console.log(`[referral] Codigo criado para user ${userId}: ${code}`)
      return code
    }

    // Se o erro e de unicidade, tentar proximo
    if (error.code === '23505') continue

    // Outro erro, parar
    console.error('[referral] Erro ao criar codigo:', error.message)
    return null
  }

  console.error(`[referral] Nao conseguiu criar codigo unico para: ${userName}`)
  return null
}

/**
 * Cria codigo de indicacao para um parceiro/instituicao.
 * Usado via Claude Code para criar codigos manualmente.
 */
export async function createPartnerReferralCode(opts: {
  partnerId: string
  code: string
  stripeCouponId?: string
  landingSlug?: string
  ownerType?: 'partner' | 'institution'
}): Promise<string | null> {
  const admin = getAdmin()
  const upperCode = opts.code.toUpperCase().replace(/[^A-Z0-9]/g, '')

  const { error } = await admin
    .from('referral_codes')
    .insert({
      code: upperCode,
      owner_type: opts.ownerType ?? 'partner',
      owner_partner_id: opts.partnerId,
      stripe_coupon_id: opts.stripeCouponId ?? null,
      landing_slug: opts.landingSlug ?? null,
      active: true,
    })

  if (error) {
    console.error('[referral] Erro ao criar codigo de parceiro:', error.message)
    return null
  }

  console.log(`[referral] Codigo de parceiro criado: ${upperCode}`)
  return upperCode
}
