// Story 006: GBP Optimization Engine — disparado após auditoria completar
// Gera sugestões de categorias, atributos, descrições e serviços otimizados

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { generateOptimizations } from '@/lib/gbp/optimization-engine'
import type { AuditReport } from '@/lib/gbp/audit-engine'
import { GBPClient } from '@/lib/google/gbp-client'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const gbpOptimizer = inngest.createFunction(
  {
    id: 'gbp-optimizer',
    triggers: [{ event: 'destaka/gbp.optimize.requested' }],
  },
  async ({ event, step }) => {
    const orgId = (event as unknown as { data: { organization_id: string } }).data.organization_id
    const db = admin()

    return await step.run(`optimize-${orgId}`, async () => {
      // Busca org + perfil GBP + concorrentes
      const [{ data: org }, { data: profile }, { data: competitors }] = await Promise.all([
        db.from('organizations').select('name, specialty').eq('id', orgId).single(),
        db.from('gbp_profiles')
          .select('location_id, description, categories, services, address, audit_report')
          .eq('organization_id', orgId)
          .single(),
        db.from('competitors')
          .select('categories')
          .eq('organization_id', orgId),
      ])

      if (!org || !profile) {
        return { status: 'skip', error: 'organização ou perfil não encontrado' }
      }

      const address = profile.address as { locality?: string; addressLines?: string[]; formattedAddress?: string } | null
      const city = address?.locality ?? 'Brasil'
      // Extrair bairro do endereco formatado (ex: "Copacabana" de "Av. Nossa Sra. de Copacabana, 1066 - Copacabana")
      const fullAddress = address?.formattedAddress ?? address?.addressLines?.join(', ') ?? ''
      const neighborhoodMatch = fullAddress.match(/[-–]\s*([^,]+),\s*(?:Rio|São|Belo|Salvador|Curitiba|Porto|Recife|Fortaleza|Brasília)/i)
      const neighborhood = neighborhoodMatch?.[1]?.trim() ?? ''

      const rawAudit = profile.audit_report as Record<string, unknown> | null
      if (!rawAudit) {
        return { status: 'skip', error: 'auditoria não disponível ainda' }
      }

      // Normaliza formato: score-calculator usa {issues}, audit-engine usa {gaps}
      const auditReport: AuditReport = {
        location_name: '',
        audited_at: (rawAudit.generated_at as string) ?? new Date().toISOString(),
        summary: (rawAudit.summary as string) ?? '',
        gaps: ((rawAudit.gaps ?? rawAudit.issues) as AuditReport['gaps']) ?? [],
        photo_count: 0,
        avg_rating: 0,
        review_count: 0,
        has_description: true,
        category_count: 0,
        attribute_count: 0,
        service_count: 0,
      }

      const competitorCategories = (competitors ?? []).map(
        (c: { categories: string[] }) => c.categories ?? []
      )

      // Buscar keyword opportunities da analise competitiva
      const { data: competitiveData } = await db
        .from('competitive_analyses')
        .select('keyword_opportunities')
        .eq('organization_id', orgId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const keywordOpportunities = (competitiveData?.keyword_opportunities as string[] | null) ?? []

      const currentServices = Array.isArray(profile.services)
        ? (profile.services as Array<{ freeFormServiceItem?: { label?: { displayName?: string } }; structuredServiceItem?: { serviceTypeId?: string } }>)
            .map(s => s.freeFormServiceItem?.label?.displayName ?? s.structuredServiceItem?.serviceTypeId ?? '')
            .filter(Boolean)
        : []

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

      // Persiste no perfil GBP
      await db
        .from('gbp_profiles')
        .update({ optimization_report: report })
        .eq('organization_id', orgId)
        .eq('location_id', profile.location_id)

      // AUTO-APPLY: atualiza descricao otimizada no banco
      // A aplicacao real no GBP acontece via /api/optimization/execute
      // Categorias, atributos e descricao basica sao aplicadas automaticamente
      const seoDesc = report.description_variants?.find(v => v.focus === 'seo')
      if (seoDesc?.text && seoDesc.text.length >= 100) {
        await db.from('gbp_profiles')
          .update({ description: seoDesc.text })
          .eq('organization_id', orgId)
          .eq('location_id', profile.location_id)
      }

      return { status: 'ok', suggestions: report.category_suggestions.length + report.attribute_suggestions.length }
    })
  }
)
