import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/health
// Retorna status do sistema: banco, env vars, última execução de crons.
// Sem autenticação — usado por monitoramento externo (UptimeRobot, etc.)
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {}

  // 1. Env vars críticas
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'CRON_SECRET',
    'ENCRYPTION_KEY',
    'RESEND_API_KEY',
  ]
  const missingEnvs = requiredEnvs.filter(k => !process.env[k])
  checks.env = {
    ok: missingEnvs.length === 0,
    detail: missingEnvs.length ? `Faltando: ${missingEnvs.join(', ')}` : 'Todas configuradas',
  }

  // 2. GMB_MOCK em produção
  const gmbMockOk = !(process.env.NODE_ENV === 'production' && process.env.GMB_MOCK === 'true')
  checks.gmb_mock = {
    ok: gmbMockOk,
    detail: gmbMockOk ? 'GMB_MOCK desativado' : 'ALERTA: GMB_MOCK=true em produção!',
  }

  // 3. Banco de dados — ping simples
  try {
    const db = createAdminClient()
    const { error } = await db.from('users').select('id').limit(1)
    checks.database = {
      ok: !error,
      detail: error ? error.message : 'Conectado',
    }
  } catch (err) {
    checks.database = { ok: false, detail: String(err) }
  }

  // 4. Último cron de cada tipo (via gmb_posts e gmb_reviews)
  try {
    const db = createAdminClient()

    const [postsRes, reviewsRes] = await Promise.all([
      db.from('gmb_posts').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('gmb_reviews').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    const lastPost = postsRes.data?.created_at ?? null
    const lastReview = reviewsRes.data?.updated_at ?? null

    const postAge = lastPost
      ? Math.round((Date.now() - new Date(lastPost).getTime()) / (1000 * 60 * 60))
      : null

    checks.cron_post_generator = {
      ok: postAge === null || postAge < 72,
      detail: postAge !== null ? `Último post há ${postAge}h` : 'Nenhum post ainda',
    }

    checks.cron_review_monitor = {
      ok: true,
      detail: lastReview
        ? `Última review atualizada: ${new Date(lastReview).toISOString()}`
        : 'Nenhuma review ainda',
    }
  } catch (err) {
    checks.cron_post_generator = { ok: false, detail: String(err) }
    checks.cron_review_monitor = { ok: false, detail: String(err) }
  }

  const allOk = Object.values(checks).every(c => c.ok)
  const status = allOk ? 200 : 503

  return NextResponse.json(
    {
      ok: allOk,
      ts: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
      env: process.env.NODE_ENV,
      checks,
    },
    { status }
  )
}
