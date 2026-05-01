// Executado uma vez no startup do servidor Next.js (Node.js runtime).
// Valida variáveis de ambiente obrigatórias antes de aceitar requisições.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertEnvVars } = await import('./lib/env-check')
    assertEnvVars()
  }
}
