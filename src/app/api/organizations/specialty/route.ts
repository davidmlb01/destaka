export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getAuthOrg, privateJson } from '@/lib/api/with-auth'

// Valores aceitos pelo constraint organizations_specialty_check
const VALID_SPECIALTIES = [
  'dentista',
  'médico',
  'psicólogo',
  'psiquiatra',
  'fisioterapeuta',
  'advogado',
  'veterinário',
  'contador',
  'imobiliária',
  'beleza',
  'fitness',
  'restaurante',
  'automotivo',
  'educação',
  'tecnologia',
  'profissional de saúde',
  'negócio local',
  'nutricionista',
  'outro',
] as const

type Specialty = (typeof VALID_SPECIALTIES)[number]

export async function PATCH(req: NextRequest) {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  let body: { specialty?: string }
  try {
    body = await req.json()
  } catch {
    return privateJson({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const specialty = body.specialty
  if (!specialty || !VALID_SPECIALTIES.includes(specialty as Specialty)) {
    return privateJson(
      { error: 'Especialidade inválida.' },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from('organizations')
    .update({ specialty })
    .eq('id', orgId)

  if (error) {
    return privateJson({ error: 'Falha ao atualizar especialidade' }, { status: 500 })
  }

  return privateJson({ ok: true, specialty })
}
