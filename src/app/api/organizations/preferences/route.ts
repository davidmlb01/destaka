export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getAuthOrg, privateJson } from '@/lib/api/with-auth'

const VALID_PREFERENCES = ['manual', 'automatico'] as const
type AutomationPreference = (typeof VALID_PREFERENCES)[number]

export async function PATCH(req: NextRequest) {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  let body: { automation_preference?: string }
  try {
    body = await req.json()
  } catch {
    return privateJson({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const preference = body.automation_preference
  if (!preference || !VALID_PREFERENCES.includes(preference as AutomationPreference)) {
    return privateJson(
      { error: 'Valor inválido. Use "manual" ou "automatico".' },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from('organizations')
    .update({ automation_preference: preference })
    .eq('id', orgId)

  if (error) {
    return privateJson({ error: 'Falha ao atualizar preferência' }, { status: 500 })
  }

  return privateJson({ ok: true, automation_preference: preference })
}
