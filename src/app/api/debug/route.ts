import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const steps: Record<string, unknown> = {}

  try {
    steps.step1_createClient = 'starting'
    const supabase = await createClient()
    steps.step1_createClient = 'ok'

    steps.step2_getUser = 'starting'
    const { data: authData, error: authError } = await supabase.auth.getUser()
    steps.step2_getUser = authError ? { error: authError.message } : { email: authData.user?.email ?? 'no user' }

    if (!authData.user) {
      return NextResponse.json({ ...steps, result: 'no user, would redirect to /login' })
    }

    steps.step3_professional = 'starting'
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id, name, organization_id, role')
      .eq('user_id', authData.user.id)
      .maybeSingle()
    steps.step3_professional = profError
      ? { error: profError.message, code: profError.code }
      : professional
        ? { id: professional.id, org_id: professional.organization_id }
        : 'null (no row)'

    if (!professional?.organization_id) {
      return NextResponse.json({ ...steps, result: 'no professional/org, would redirect to /login' })
    }

    const orgId = professional.organization_id

    steps.step4_org = 'starting'
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, specialty')
      .eq('id', orgId)
      .maybeSingle()
    steps.step4_org = orgError ? { error: orgError.message, code: orgError.code } : org

    steps.step5_score = 'starting'
    const { data: score, error: scoreError } = await supabase
      .from('scores')
      .select('total, faixa')
      .eq('organization_id', orgId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    steps.step5_score = scoreError ? { error: scoreError.message, code: scoreError.code } : score ?? 'null'

    steps.step6_profile = 'starting'
    const { data: profile, error: profileError } = await supabase
      .from('gbp_profiles')
      .select('id')
      .eq('organization_id', orgId)
      .maybeSingle()
    steps.step6_profile = profileError ? { error: profileError.message, code: profileError.code } : profile ?? 'null'

    steps.step7_reviews = 'starting'
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
    steps.step7_reviews = reviewsError ? { error: reviewsError.message, code: reviewsError.code } : `${reviews?.length ?? 0} rows`

    return NextResponse.json({ ...steps, result: 'ALL STEPS OK - dashboard should load' })
  } catch (err) {
    return NextResponse.json({
      ...steps,
      caught_error: err instanceof Error ? { message: err.message, stack: err.stack?.split('\n').slice(0, 5) } : String(err),
    }, { status: 500 })
  }
}
