// =============================================================================
// DESTAKA — Validação de autenticação de crons
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

export function validateCronAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron-auth] CRON_SECRET não configurado — cron bloqueado')
    return NextResponse.json({ error: 'Cron não configurado' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`

  let isValid = false
  try {
    // timingSafeEqual previne timing attacks (comparação bit a bit em tempo constante)
    isValid = authHeader.length === expected.length &&
      timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  } catch {
    isValid = false
  }

  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null // autorizado
}
