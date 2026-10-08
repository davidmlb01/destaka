import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { inngest } from '@/lib/inngest/client'
import { z } from 'zod'

const OnboardingSchema = z.object({
  automation_preference: z.enum(['automatico', 'manual']),
  phone: z.string().min(10).max(20),
  instagram_handle: z.string().max(50).nullable().optional(),
  lgpd_ai_consent: z.boolean(),
  challenge: z.enum(['more_patients', 'more_reviews', 'more_visibility', 'all']).optional(),
  patient_volume: z.enum(['under_10', '10_30', '30_60', 'over_60']).optional(),
  services: z.array(z.string().max(200)).max(8).nullable().optional(),
  differentials: z.string().max(500).nullable().optional(),
})

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const admin = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Busca professional e org existentes (criados pelo auth callback)
  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

  const parsed = OnboardingSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos. Verifique os campos.' }, { status: 400 })
  }

  const {
    automation_preference, phone, instagram_handle,
    lgpd_ai_consent, challenge, patient_volume, services, differentials,
  } = parsed.data

  // Valida formato do instagram_handle se fornecido
  if (instagram_handle && !instagram_handle.startsWith('@')) {
    return NextResponse.json({ error: 'Instagram deve começar com @' }, { status: 400 })
  }

  // Monta payload de update
  const orgUpdate: Record<string, unknown> = {
    automation_preference,
    phone,
    lgpd_ai_consent,
    lgpd_consent_date: lgpd_ai_consent ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  if (instagram_handle) {
    orgUpdate.instagram_handle = instagram_handle
  }
  if (challenge) orgUpdate.challenge = challenge
  if (patient_volume) orgUpdate.patient_volume = patient_volume
  if (services && services.length > 0) orgUpdate.services = services
  if (differentials) orgUpdate.differentials = differentials

  const { error: updateError } = await admin
    .from('organizations')
    .update(orgUpdate)
    .eq('id', orgId)

  if (updateError) {
    console.error('[onboarding] Falha ao atualizar organização:', updateError.message)
    return NextResponse.json({ error: 'Falha ao salvar dados. Tente novamente.' }, { status: 500 })
  }

  // Dispara jobs em background (auditoria, score, geo, keywords)
  inngest.send([
    { name: 'destaka/gbp.audit.requested', data: { organization_id: orgId } },
    { name: 'destaka/score.calculate.requested', data: { organization_id: orgId } },
    { name: 'destaka/geo.collect.requested', data: { organization_id: orgId } },
    { name: 'destaka/keywords.snapshot.requested', data: { organization_id: orgId } },
  ]).catch(() => {})

  return NextResponse.json({ ok: true })
}
