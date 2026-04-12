// Story 006: GBP Optimization Engine — disparado após auditoria completar
// Gera sugestões de categorias, atributos, descrições e serviços otimizados

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { generateOptimizations } from '@/lib/gbp/optimization-engine'
import type { AuditReport } from '@/lib/gbp/audit-engine'

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

      const address = profile.address as { locality?: string } | null
      const city = address?.locality ?? 'Brasil'

      const auditReport = profile.audit_report as AuditReport | null
      if (!auditReport) {
        return { status: 'skip', error: 'auditoria não disponível ainda' }
      }

      const competitorCategories = (competitors ?? []).map(
        (c: { categories: string[] }) => c.categories ?? []
      )

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
        currentDescription: profile.description ?? null,
        currentCategories: profile.categories ?? [],
        currentServices,
        competitorCategories,
      })

      // Persiste no perfil GBP
      await db
        .from('gbp_profiles')
        .update({ optimization_report: report })
        .eq('organization_id', orgId)
        .eq('location_id', profile.location_id)

      return { status: 'ok', suggestions: report.category_suggestions.length + report.attribute_suggestions.length }
    })
  }
)
