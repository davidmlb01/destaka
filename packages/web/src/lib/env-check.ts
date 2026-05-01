// =============================================================================
// DESTAKA — Validação de variáveis de ambiente obrigatórias
// Chamado no startup de rotas críticas para detectar env vars faltando.
// =============================================================================

const REQUIRED_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_PLACES_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_PRO',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ENCRYPTION_KEY',
  'CRON_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const

let _checked = false

export function assertEnvVars(): void {
  if (_checked) return
  _checked = true

  const missing: string[] = []
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) missing.push(key)
  }

  if (missing.length > 0) {
    const msg = `[env-check] Variáveis de ambiente obrigatórias não configuradas: ${missing.join(', ')}`
    console.error(msg)
    // Em produção, lança erro para evitar comportamento silencioso incorreto
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg)
    }
  }
}
