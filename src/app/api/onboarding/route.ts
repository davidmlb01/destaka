import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

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

  const body = await request.json()
  const { name, specialty, tone, automation_preference } = body

  if (!name || !specialty || !tone || !automation_preference) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Cria organização via service role (bypass RLS — novo usuário sem professional ainda)
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name, specialty, tone, automation_preference })
    .select()
    .single()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 })
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
    return NextResponse.json({ error: profError.message }, { status: 500 })
  }

  return NextResponse.json({ organization_id: org.id })
}
