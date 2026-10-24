export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { generateOptimizations } from '@/lib/gbp/optimization-engine'
import type { AuditReport } from '@/lib/gbp/audit-engine'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  // Proteger com admin secret
  const authHeader = req.headers.get('x-admin-key')
  if (authHeader !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { organization_id?: string }
  const orgId = body.organization_id
  if (!orgId) return NextResponse.json({ error: 'organization_id required' }, { status: 400 })

  const db = admin()

  const [{ data: org }, { data: profile }] = await Promise.all([
    db.from('organizations').select('name, specialty').eq('id', orgId).maybeSingle(),
    db.from('gbp_profiles')
      .select('location_id, description, categories, services, address, audit_report')
      .eq('organization_id', orgId)
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Competitors usa profile_id (gmb_profiles FK)
  const { data: gmbProf } = await db.from('gmb_profiles').select('id').eq('name', org?.name ?? '').maybeSingle()
  const { data: competitors } = gmbProf?.id
    ? await db.from('competitors').select('categories').eq('profile_id', gmbProf.id)
    : { data: [] as Array<{ categories: string[] }> }

  if (!org || !profile) {
    return NextResponse.json({ error: 'org ou perfil nao encontrado', org: !!org, profile: !!profile, orgId }, { status: 404 })
  }

  const address = profile.address as { locality?: string; addressLines?: string[]; sublocality?: string } | null
  const city = address?.locality ?? 'Brasil'
  const fullAddress = address?.addressLines?.join(', ') ?? ''
  const knownBairros = ['Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Tijuca', 'Barra', 'Centro', 'Lapa', 'Pinheiros', 'Vila Mariana', 'Moema', 'Jardins', 'Savassi']
  const neighborhood = address?.sublocality ?? knownBairros.find(b => fullAddress.toLowerCase().includes(b.toLowerCase())) ?? ''

  const rawAudit = profile.audit_report as Record<string, unknown> | null
  const auditReport: AuditReport = {
    location_name: '',
    audited_at: (rawAudit?.generated_at as string) ?? new Date().toISOString(),
    summary: (rawAudit?.summary as string) ?? '',
    gaps: ((rawAudit?.gaps ?? rawAudit?.issues) as AuditReport['gaps']) ?? [],
    photo_count: 0,
    avg_rating: 0,
    review_count: 0,
    has_description: !!profile.description,
    category_count: (profile.categories ?? []).length,
    attribute_count: 0,
    service_count: 0,
  }

  const competitorCategories = (competitors ?? []).map(
    (c: { categories: string[] }) => c.categories ?? []
  )

  const { data: competitiveData } = await db
    .from('competitive_analyses')
    .select('keyword_opportunities')
    .eq('organization_id', orgId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const keywordOpportunities = (competitiveData?.keyword_opportunities as string[] | null) ?? []

  const rawServices = Array.isArray(profile.services) ? profile.services : []
  const currentServices = rawServices.map((s: unknown) => {
    if (typeof s === 'string') return s
    const obj = s as { freeFormServiceItem?: { label?: { displayName?: string } } }
    return obj.freeFormServiceItem?.label?.displayName ?? ''
  }).filter(Boolean) as string[]

  try {
    const report = await generateOptimizations({
      auditReport,
      specialty: org.specialty,
      professionalName: org.name,
      city,
      neighborhood,
      fullAddress,
      currentDescription: profile.description ?? null,
      currentCategories: profile.categories ?? [],
      currentServices,
      competitorCategories,
      keywordOpportunities,
    })

    await db
      .from('gbp_profiles')
      .update({ optimization_report: report })
      .eq('organization_id', orgId)
      .eq('location_id', profile.location_id)

    // Auto-apply descricao SEO
    const seoDesc = report.description_variants?.find(v => v.focus === 'seo')
    if (seoDesc?.text && seoDesc.text.length >= 100) {
      await db.from('gbp_profiles')
        .update({ description: seoDesc.text })
        .eq('organization_id', orgId)
    }

    return NextResponse.json({
      ok: true,
      categories: report.category_suggestions?.length ?? 0,
      attributes: report.attribute_suggestions?.length ?? 0,
      descriptions: report.description_variants?.length ?? 0,
      services: report.service_optimizations?.length ?? 0,
      competitor_gaps: report.competitor_gaps?.length ?? 0,
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'unknown',
      stack: err instanceof Error ? err.stack?.slice(0, 500) : undefined,
    }, { status: 500 })
  }
}
