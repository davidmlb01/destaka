// =============================================================================
// DESTAKA — Validação de autenticação de crons
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'

export function validateCronAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron-auth] CRON_SECRET não configurado — cron bloqueado')
    return NextResponse.json({ error: 'Cron não configurado' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null // autorizado
}
