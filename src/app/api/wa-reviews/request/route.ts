// WhatsApp Review Automation: gatilho manual de pedido de avaliacao
// Padrao 3: profissional clica "Pedir avaliacao" no dashboard
// Cria review_request diretamente, sem depender de deteccao de consulta

import { NextRequest, NextResponse } from 'next/server'
import { getAuthOrg } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import {
  getConnection,
  getSettings,
  upsertContact,
  hasRecentRequest,
  countMonthlyRequests,
  getContactByPhone,
} from '@/lib/wa-reviews/db'
import { calculateSendTime, buildReviewLink } from '@/lib/wa-reviews/scheduler'

export const dynamic = 'force-dynamic'

function adminDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST: criar pedido de avaliacao manual
export async function POST(request: NextRequest) {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth

  // Validar body
  let body: { phone: string; name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  if (!body.phone || typeof body.phone !== 'string') {
    return NextResponse.json({ error: 'Telefone obrigatorio' }, { status: 400 })
  }

  // Normalizar telefone para E.164
  const phone = normalizePhone(body.phone)
  if (!phone) {
    return NextResponse.json({ error: 'Formato de telefone invalido' }, { status: 400 })
  }

  // Verificar conexao WhatsApp
  const connection = await getConnection(orgId)
  if (!connection || connection.status === 'disconnected' || connection.status === 'pending') {
    return NextResponse.json(
      { error: 'WhatsApp nao conectado. Conecte seu numero na Kapso primeiro.' },
      { status: 400 }
    )
  }

  // Buscar settings
  const settings = await getSettings(orgId)

  // Criar ou buscar contato
  const contact = await upsertContact(orgId, phone, body.name ?? null)

  // Verificar opt-out
  if (contact.opted_out_at) {
    return NextResponse.json(
      { error: 'Este contato pediu para nao receber mensagens.' },
      { status: 400 }
    )
  }

  // Verificar intervalo minimo
  const recent = await hasRecentRequest(orgId, contact.id, settings.min_interval_days)
  if (recent) {
    return NextResponse.json(
      { error: `Ja foi enviado um pedido para este contato nos ultimos ${settings.min_interval_days} dias.` },
      { status: 400 }
    )
  }

  // Verificar cap mensal
  const monthlyCount = await countMonthlyRequests(orgId)
  if (monthlyCount >= settings.monthly_cap) {
    return NextResponse.json(
      { error: `Limite mensal de ${settings.monthly_cap} pedidos atingido.` },
      { status: 400 }
    )
  }

  // Calcular horario de envio (agora ou proximo horario dentro da janela)
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const sendTime = calculateSendTime(
    todayStr,
    0, // sem delay, envio o mais rapido possivel
    settings.send_window_start,
    settings.send_window_end,
    settings.timezone
  )

  // Se o horario calculado ja passou hoje, enviar amanha
  const scheduledFor = sendTime > now ? sendTime : calculateSendTime(
    todayStr,
    1,
    settings.send_window_start,
    settings.send_window_end,
    settings.timezone
  )

  // Criar review_request (sem appointment_event, gatilho manual)
  const db = adminDb()
  const { data: reviewRequest, error } = await db
    .from('review_requests')
    .insert({
      organization_id: orgId,
      contact_id: contact.id,
      appointment_event_id: null, // manual, sem evento de consulta
      scheduled_for: scheduledFor.toISOString(),
      status: connection.status === 'shadow' ? 'skipped' : 'scheduled',
      skip_reason: connection.status === 'shadow' ? 'shadow' : null,
    })
    .select('id, scheduled_for, status')
    .single()

  if (error) {
    logger.error('wa-reviews-manual', `Falha ao criar request: ${error.message}`, { orgId })
    return NextResponse.json({ error: 'Falha ao criar pedido' }, { status: 500 })
  }

  logger.info('wa-reviews-manual', 'Pedido manual criado', {
    orgId,
    contactId: contact.id,
    requestId: reviewRequest.id,
  })

  return NextResponse.json({
    success: true,
    request_id: reviewRequest.id,
    scheduled_for: reviewRequest.scheduled_for,
    status: reviewRequest.status,
    contact_name: contact.display_name,
    message: reviewRequest.status === 'skipped'
      ? 'Modo sombra ativo. O pedido foi registrado mas nao sera enviado.'
      : `Pedido agendado para ${new Date(reviewRequest.scheduled_for).toLocaleString('pt-BR', { timeZone: settings.timezone })}`,
  })
}

// GET: listar pedidos recentes da org
export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth

  const db = adminDb()

  const { data, error } = await db
    .from('review_requests')
    .select('id, contact_id, scheduled_for, status, skip_reason, sent_at, delivered_at, read_at, clicked_at, template_name, cost_estimate_brl, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Falha ao buscar pedidos' }, { status: 500 })
  }

  // Enriquecer com nome do contato
  const contactIds = [...new Set((data ?? []).map(r => r.contact_id))]
  const { data: contacts } = await db
    .from('patient_contacts')
    .select('id, display_name')
    .eq('organization_id', orgId)
    .in('id', contactIds)

  const contactMap = new Map((contacts ?? []).map(c => [c.id, c.display_name]))

  const enriched = (data ?? []).map(r => ({
    ...r,
    contact_name: contactMap.get(r.contact_id) ?? null,
  }))

  return NextResponse.json({ requests: enriched })
}

// Normalizar telefone brasileiro para E.164
function normalizePhone(raw: string): string | null {
  // Remover tudo que nao e digito ou +
  const cleaned = raw.replace(/[^\d+]/g, '')

  // Ja esta em E.164
  if (/^\+55\d{10,11}$/.test(cleaned)) return cleaned

  // Sem +55, adicionar
  if (/^55\d{10,11}$/.test(cleaned)) return `+${cleaned}`

  // Numero local (DDD + numero)
  if (/^\d{10,11}$/.test(cleaned)) return `+55${cleaned}`

  return null
}
