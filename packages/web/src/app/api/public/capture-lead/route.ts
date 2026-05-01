import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLeadMagnetEmail } from '@/lib/email/lead-magnet'
import { rateLimit } from '@/lib/redis'
import type { CategoryScore } from '@/lib/gmb/scorer'
import { createHash } from 'crypto'

const MAX_PER_IP_PER_DAY = 5

function getServiceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.ENCRYPTION_KEY ?? '')).digest('hex').slice(0, 16)
}

// POST /api/public/capture-lead
// Body: { email, placeName, score, categories, lgpdConsent }
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipHash = hashIp(ip)

  // Rate limiting por IP — fail-open se Redis indisponível
  const key = `ratelimit:lead:${ipHash}`
  const count = await rateLimit(key, 86400)
  if (count !== null && count > MAX_PER_IP_PER_DAY) {
    return NextResponse.json(
      { error: 'Limite de auditorias diarias atingido. Tente novamente amanha.' },
      { status: 429 }
    )
  }

  let body: {
    email?: string
    placeName?: string
    score?: number
    categories?: CategoryScore[]
    lgpdConsent?: boolean
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const { email, placeName, score, categories, lgpdConsent } = body

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalido' }, { status: 400 })
  }

  if (!lgpdConsent) {
    return NextResponse.json({ error: 'Consentimento LGPD obrigatorio' }, { status: 400 })
  }

  const topGaps = (categories ?? [])
    .flatMap(c => c.issues)
    .filter(i => i.severity === 'critical' || i.severity === 'warning')
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map(g => ({ message: g.message, impact: g.impact }))

  const db = getServiceDb()

  // Salva o lead
  const { error: insertError } = await db.from('leads').insert({
    email,
    place_name: placeName ?? null,
    score: score ?? null,
    top_gaps: topGaps,
    ip_hash: ipHash,
    lgpd_consent: true,
    email_sent: false,
  })

  if (insertError) {
    console.error('[capture-lead] insert error:', insertError)
    // Nao bloqueia: continua e tenta enviar o email
  }

  // Envia email
  let emailSent = false
  if (categories && score !== undefined && placeName) {
    try {
      await sendLeadMagnetEmail({ to: email, placeName, score, categories })
      emailSent = true
      await db.from('leads').update({ email_sent: true }).eq('email', email).order('created_at', { ascending: false }).limit(1)
    } catch (err) {
      console.error('[capture-lead] email send error:', err)
    }
  }

  return NextResponse.json({ ok: true, emailSent })
}
