import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Busca professional + org existentes
  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ org: null })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name, phone, specialty, lgpd_ai_consent')
    .eq('id', professional.organization_id)
    .maybeSingle()

  if (!org) {
    return NextResponse.json({ org: null })
  }

  // Se lgpd_ai_consent ja foi definido, onboarding ja foi completado
  if (org.lgpd_ai_consent !== null) {
    return NextResponse.json({ completed: true, org: null })
  }

  return NextResponse.json({
    org: {
      name: org.name ?? '',
      phone: org.phone ?? '',
      specialty: org.specialty ?? '',
    },
  })
}
