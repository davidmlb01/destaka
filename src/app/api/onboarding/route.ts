import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { inngest } from '@/lib/inngest/client'
import { encrypt } from '@/lib/crypto'
import { z } from 'zod'

const OnboardingSchema = z.object({
  name: z.string().min(1).max(200),
  specialty: z.string().min(1).max(100),
  tone: z.enum(['formal', 'proximo', 'tecnico']),
  automation_preference: z.enum(['automatico', 'manual']),
  instagram_handle: z.string().max(50).optional(),
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

  const parsed = OnboardingSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados invalidos. Verifique os campos.' }, { status: 400 })
  }
  const { name, specialty, tone, automation_preference, instagram_handle } = parsed.data

  // Cria organização via service role (bypass RLS — novo usuário sem professional ainda)
  const orgPayload: Record<string, string> = { name, specialty, tone, automation_preference }
  if (instagram_handle) {
    orgPayload.instagram_handle = instagram_handle.startsWith('@')
      ? instagram_handle
      : `@${instagram_handle}`
  }

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert(orgPayload)
    .select()
    .single()

  if (orgError) {
    console.error('[onboarding] Falha ao criar organizacao:', orgError.message)
    return NextResponse.json({ error: 'Falha ao criar organizacao. Tente novamente.' }, { status: 500 })
  }

  // Cria professional vinculado ao usuário
  const { error: profError } = await admin
    .from('professionals')
    .insert({
      user_id: user.id,
      organization_id: org.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? user.email!,
      role: 'owner',
    })

  if (profError) {
    console.error('[onboarding] Falha ao criar professional:', profError.message)
    return NextResponse.json({ error: 'Falha ao criar perfil profissional. Tente novamente.' }, { status: 500 })
  }

  // Recupera token do Google armazenado nos metadados durante o callback
  const { data: userData } = await admin.auth.admin.getUserById(user.id)
  const meta = userData?.user?.user_metadata ?? {}

  if (meta.gbp_access_token) {
    await admin.from('google_tokens').insert({
      organization_id: org.id,
      access_token: encrypt(meta.gbp_access_token),
      refresh_token: meta.gbp_refresh_token
        ? encrypt(meta.gbp_refresh_token)
        : null,
    })

    // Limpar tokens do user_metadata (nao devem ficar acessiveis client-side)
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        gbp_access_token: undefined,
        gbp_refresh_token: undefined,
        gbp_token_expires_at: undefined,
      },
    })
  }

  // Dispara importação + auditoria GBP via Inngest
  await inngest.send({
    name: 'destaka/gbp.audit.requested',
    data: { organization_id: org.id },
  })

  return NextResponse.json({ organization_id: org.id })
}
