import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ org: null })
  }

  const orgId = professional.organization_id

  const { data: org } = await supabase
    .from('organizations')
    .select('name, phone, specialty, lgpd_ai_consent')
    .eq('id', orgId)
    .maybeSingle()

  if (!org) {
    return NextResponse.json({ org: null })
  }

  const isCompleted = org.lgpd_ai_consent !== null

  // Busca servicos do GBP profile (ja coletados pelo callback)
  const admin = createServiceClient()

  const [{ data: gbpProfile }, { data: competitors }] = await Promise.all([
    admin
      .from('gbp_profiles')
      .select('services, categories')
      .eq('organization_id', orgId)
      .maybeSingle(),
    admin
      .from('competitors')
      .select('name, categories')
      .eq('profile_id', (
        await admin.from('gbp_profiles').select('id').eq('organization_id', orgId).maybeSingle()
      ).data?.id ?? '')
      .limit(5),
  ])

  // Extrai servicos do GBP
  const gbpServices: string[] = []
  if (gbpProfile?.services && Array.isArray(gbpProfile.services)) {
    for (const svc of gbpProfile.services) {
      const name = typeof svc === 'string' ? svc : (svc as Record<string, unknown>)?.displayName ?? (svc as Record<string, unknown>)?.name
      if (typeof name === 'string' && name.trim()) gbpServices.push(name.trim())
    }
  }

  // Extrai categorias dos concorrentes como sugestoes
  const competitorServices: string[] = []
  if (competitors && Array.isArray(competitors)) {
    for (const comp of competitors) {
      if (comp.categories && Array.isArray(comp.categories)) {
        for (const cat of comp.categories) {
          const name = typeof cat === 'string' ? cat : (cat as Record<string, unknown>)?.displayName
          if (typeof name === 'string' && name.trim() && !competitorServices.includes(name.trim())) {
            competitorServices.push(name.trim())
          }
        }
      }
    }
  }

  return NextResponse.json({
    completed: isCompleted,
    org: {
      name: org.name ?? '',
      phone: org.phone ?? '',
      specialty: org.specialty ?? '',
    },
    gbpServices,
    competitorServices,
  })
}
