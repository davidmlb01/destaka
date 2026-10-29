export const dynamic = 'force-dynamic'

// API de indicacao: retorna codigo, link, indicacoes e desconto do usuario logado
import { NextResponse } from 'next/server'
import { getAuthOrg } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

function createServiceClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function mapSpecialtyToPath(specialty: string | null | undefined): string {
  if (!specialty) return ''
  const s = specialty.toLowerCase()
  if (s.includes('medic') || s.includes('médic') || s.includes('saude') || s.includes('saúde') || s.includes('fisio') || s.includes('dentist') || s.includes('odonto') || s.includes('clinic') || s.includes('clínic') || s.includes('nutri') || s.includes('psicol') || s.includes('fono') || s.includes('dermat')) return '/saude'
  if (s.includes('pet') || s.includes('vet') || s.includes('animal')) return '/pet'
  if (s.includes('advog') || s.includes('jurid') || s.includes('direito')) return '/juridico'
  return ''
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { user } = auth

  const admin = createServiceClient()

  // Buscar codigo do usuario
  const { data: codeRecord } = await admin
    .from('referral_codes')
    .select('id, code, active')
    .eq('owner_user_id', user.id)
    .eq('owner_type', 'client')
    .eq('active', true)
    .maybeSingle()

  if (!codeRecord) {
    return NextResponse.json({
      code: null,
      link: null,
      referrals: [],
      activeCount: 0,
      discountPercent: 0,
    })
  }

  // Buscar indicacoes desse codigo
  const { data: referrals } = await admin
    .from('referrals')
    .select(`
      id,
      status,
      activated_at,
      created_at,
      referred_org_id
    `)
    .eq('referral_code_id', codeRecord.id)
    .order('created_at', { ascending: false })

  // Buscar nomes das orgs indicadas
  const orgIds = (referrals ?? [])
    .map(r => r.referred_org_id)
    .filter(Boolean)

  let orgNames: Record<string, string> = {}
  if (orgIds.length > 0) {
    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name')
      .in('id', orgIds)

    orgNames = Object.fromEntries(
      (orgs ?? []).map(o => [o.id, o.name])
    )
  }

  const activeCount = (referrals ?? []).filter(r => r.status === 'active').length
  const discountPercent = Math.min(activeCount * 20, 100)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

  // Detect vertical from org specialty to build correct landing URL
  const { data: orgData } = await admin
    .from('organizations')
    .select('specialty')
    .eq('id', auth.orgId)
    .maybeSingle()

  const verticalPath = mapSpecialtyToPath(orgData?.specialty)

  return NextResponse.json({
    code: codeRecord.code,
    link: `${appUrl}${verticalPath}?ref=${codeRecord.code}`,
    activeCount,
    discountPercent,
    referrals: (referrals ?? []).map(r => ({
      id: r.id,
      orgName: r.referred_org_id ? (orgNames[r.referred_org_id] ?? 'Profissional') : 'Profissional',
      status: r.status,
      activatedAt: r.activated_at,
      createdAt: r.created_at,
    })),
  })
}
