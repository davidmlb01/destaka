import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { inngest } from '@/lib/inngest/client'
import { createClientReferralCode } from '@/lib/referral/generate-code'
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
  attributes: z.array(z.string().max(50)).max(20).nullable().optional(),
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
    lgpd_ai_consent, challenge, patient_volume, services, differentials, attributes,
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

  // Salva atributos no gbp_profiles (são dados do perfil GBP, não da org)
  if (attributes && attributes.length > 0) {
    const { data: gbpProfile } = await admin
      .from('gbp_profiles')
      .select('id, attributes')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (gbpProfile) {
      const existingAttrs = (gbpProfile.attributes as Record<string, unknown>) ?? {}
      const mergedAttrs = { ...existingAttrs }
      for (const attr of attributes) {
        mergedAttrs[attr] = true
      }
      await admin
        .from('gbp_profiles')
        .update({ attributes: mergedAttrs })
        .eq('id', gbpProfile.id)
    }
  }

  const { error: updateError } = await admin
    .from('organizations')
    .update(orgUpdate)
    .eq('id', orgId)

  if (updateError) {
    console.error('[onboarding] Falha ao atualizar organização:', updateError.message)
    return NextResponse.json({ error: 'Falha ao salvar dados. Tente novamente.' }, { status: 500 })
  }

  // Gerar codigo de indicacao automaticamente (se ainda nao tem)
  try {
    const { data: existingCode } = await admin
      .from('referral_codes')
      .select('code')
      .eq('owner_user_id', user.id)
      .eq('owner_type', 'client')
      .maybeSingle()

    if (!existingCode) {
      const { data: orgData } = await admin
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .maybeSingle()

      const displayName = orgData?.name ?? user.email ?? 'USER'
      await createClientReferralCode(user.id, displayName)
    }
  } catch (refErr) {
    console.error('[referral] Erro ao gerar codigo no onboarding:', refErr)
    // Nao bloqueia o onboarding se falhar
  }

  // Dispara TODOS os jobs em background apos onboarding completo
  // O Destaka comeca a agir imediatamente: otimiza perfil, responde avaliacoes, gera posts
  inngest.send([
    { name: 'destaka/gbp.audit.requested', data: { organization_id: orgId } },
    { name: 'destaka/score.calculate.requested', data: { organization_id: orgId } },
    { name: 'destaka/geo.collect.requested', data: { organization_id: orgId } },
    { name: 'destaka/keywords.snapshot.requested', data: { organization_id: orgId } },
    { name: 'destaka/performance.collect.requested', data: { organization_id: orgId } },
    { name: 'destaka/reviews.sync.requested', data: {} },
    { name: 'destaka/gbp.optimize.requested', data: { organization_id: orgId } },
    { name: 'destaka/post.generate.requested', data: { organization_id: orgId } },
  ]).catch(() => {})

  return NextResponse.json({ ok: true })
}
