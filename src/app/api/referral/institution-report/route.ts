export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual, createHmac } from 'crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function safeCompare(a: string, b: string): boolean {
  const ha = createHmac('sha256', 'destaka-admin').update(a).digest()
  const hb = createHmac('sha256', 'destaka-admin').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/**
 * GET /api/referral/institution-report?partner_id=UUID
 *
 * Retorna relatorio de indicacoes de uma instituicao/parceiro.
 * Protegido por x-admin-key header (ADMIN_SECRET_KEY).
 *
 * Resposta:
 * - institution: nome da instituicao
 * - activeMembers: membros ativos (status = 'active')
 * - newMembersThisMonth: novos membros no mes corrente
 * - totalMembers: total de indicados (qualquer status)
 * - monthlyEvolution: ultimos 6 meses com contagem de novos membros
 */
export async function GET(req: NextRequest) {
  // Autenticacao via admin key
  const adminKey = req.headers.get('x-admin-key')
  const adminSecretKey = process.env.ADMIN_SECRET_KEY

  if (!adminSecretKey || adminSecretKey.length < 16) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (!adminKey || !safeCompare(adminKey, adminSecretKey)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Validar partner_id
  const partnerId = req.nextUrl.searchParams.get('partner_id')
  if (!partnerId) {
    return NextResponse.json({ error: 'partner_id is required' }, { status: 400 })
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(partnerId)) {
    return NextResponse.json({ error: 'Invalid partner_id format' }, { status: 400 })
  }

  const admin = getServiceClient()

  // Buscar dados da instituicao
  const { data: partner, error: partnerError } = await admin
    .from('partners')
    .select('id, name, type')
    .eq('id', partnerId)
    .maybeSingle()

  if (partnerError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  // Buscar todos os referral_codes dessa instituicao
  const { data: codes } = await admin
    .from('referral_codes')
    .select('id')
    .eq('owner_partner_id', partnerId)

  const codeIds = (codes ?? []).map((c) => c.id)

  if (codeIds.length === 0) {
    return NextResponse.json({
      institution: partner.name,
      type: partner.type,
      activeMembers: 0,
      newMembersThisMonth: 0,
      totalMembers: 0,
      monthlyEvolution: [],
    })
  }

  // Buscar todas as indicacoes desses codigos
  const { data: referrals } = await admin
    .from('referrals')
    .select('id, status, created_at, activated_at')
    .in('referral_code_id', codeIds)

  const allReferrals = referrals ?? []

  // Metricas gerais
  const activeMembers = allReferrals.filter((r) => r.status === 'active').length
  const totalMembers = allReferrals.length

  // Novos membros neste mes
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newMembersThisMonth = allReferrals.filter(
    (r) => new Date(r.created_at) >= startOfMonth
  ).length

  // Evolucao mensal (ultimos 6 meses)
  const monthlyEvolution: { month: string; newMembers: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)

    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const count = allReferrals.filter((r) => {
      const created = new Date(r.created_at)
      return created >= monthStart && created < monthEnd
    }).length

    monthlyEvolution.push({ month: label, newMembers: count })
  }

  return NextResponse.json({
    institution: partner.name,
    type: partner.type,
    activeMembers,
    newMembersThisMonth,
    totalMembers,
    monthlyEvolution,
  })
}
