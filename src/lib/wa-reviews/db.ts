// WhatsApp Review Automation: camada de acesso ao banco
// REGRA: toda consulta exige organization_id. Sem exceção.

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/lib/crypto'
import crypto from 'crypto'

// Admin client (bypassa RLS, usado por Inngest functions e webhooks)
export function adminDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Hash telefone para busca (determinístico, sem salt)
export function hashPhone(phone: string): string {
  return crypto.createHash('sha256').update(phone).digest('hex')
}

// ============================================================
// whatsapp_connections
// ============================================================

export interface WhatsAppConnection {
  id: string
  organization_id: string
  provider: string
  provider_account_ref: string | null
  phone_number_id: string | null
  display_phone: string | null
  status: 'pending' | 'shadow' | 'active' | 'disconnected'
  last_event_at: string | null
  connected_at: string | null
  disconnected_at: string | null
}

export async function getConnection(orgId: string): Promise<WhatsAppConnection | null> {
  const { data } = await adminDb()
    .from('whatsapp_connections')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle()
  return data as WhatsAppConnection | null
}

export async function upsertConnection(
  orgId: string,
  fields: Partial<Omit<WhatsAppConnection, 'id' | 'organization_id'>>
): Promise<WhatsAppConnection> {
  const { data, error } = await adminDb()
    .from('whatsapp_connections')
    .upsert(
      { organization_id: orgId, ...fields },
      { onConflict: 'organization_id' }
    )
    .select()
    .single()
  if (error) throw new Error(`[wa-reviews] upsertConnection falhou: ${error.message}`)
  return data as WhatsAppConnection
}

export async function updateConnectionStatus(
  orgId: string,
  status: WhatsAppConnection['status'],
  extra?: Record<string, unknown>
): Promise<void> {
  const { error } = await adminDb()
    .from('whatsapp_connections')
    .update({ status, ...extra })
    .eq('organization_id', orgId)
  if (error) throw new Error(`[wa-reviews] updateConnectionStatus falhou: ${error.message}`)
}

// ============================================================
// patient_contacts
// ============================================================

export interface PatientContact {
  id: string
  organization_id: string
  phone_e164: string
  phone_hash: string
  display_name: string | null
  first_seen_at: string
  last_message_at: string | null
  opted_out_at: string | null
  opted_out_source: 'keyword' | 'button' | 'admin' | null
}

export async function upsertContact(
  orgId: string,
  phoneE164: string,
  displayName: string | null
): Promise<PatientContact> {
  const hash = hashPhone(phoneE164)
  const encrypted = encrypt(phoneE164)

  const { data, error } = await adminDb()
    .from('patient_contacts')
    .upsert(
      {
        organization_id: orgId,
        phone_e164: encrypted,
        phone_hash: hash,
        display_name: displayName,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,phone_hash' }
    )
    .select()
    .single()

  if (error) throw new Error(`[wa-reviews] upsertContact falhou: ${error.message}`)
  return data as PatientContact
}

export async function getContactByPhone(
  orgId: string,
  phoneE164: string
): Promise<PatientContact | null> {
  const hash = hashPhone(phoneE164)
  const { data } = await adminDb()
    .from('patient_contacts')
    .select('*')
    .eq('organization_id', orgId)
    .eq('phone_hash', hash)
    .maybeSingle()
  return data as PatientContact | null
}

export async function getContactById(
  orgId: string,
  contactId: string
): Promise<PatientContact | null> {
  const { data } = await adminDb()
    .from('patient_contacts')
    .select('*')
    .eq('organization_id', orgId)
    .eq('id', contactId)
    .maybeSingle()
  return data as PatientContact | null
}

export function decryptPhone(contact: PatientContact): string {
  return decrypt(contact.phone_e164)
}

export async function optOutContact(
  orgId: string,
  contactId: string,
  source: 'keyword' | 'button' | 'admin'
): Promise<void> {
  const { error } = await adminDb()
    .from('patient_contacts')
    .update({
      opted_out_at: new Date().toISOString(),
      opted_out_source: source,
    })
    .eq('organization_id', orgId)
    .eq('id', contactId)
  if (error) throw new Error(`[wa-reviews] optOutContact falhou: ${error.message}`)
}

// Direito do titular: apagar todos os dados de um paciente
export async function deletePatientData(
  orgId: string,
  phoneE164: string
): Promise<{ deleted: boolean }> {
  const hash = hashPhone(phoneE164)
  const db = adminDb()

  const { data: contact } = await db
    .from('patient_contacts')
    .select('id')
    .eq('organization_id', orgId)
    .eq('phone_hash', hash)
    .maybeSingle()

  if (!contact) return { deleted: false }

  // Cascade: review_requests e appointment_events referenciam contact_id
  // Deletar na ordem correta
  await db.from('review_requests')
    .delete()
    .eq('organization_id', orgId)
    .eq('contact_id', contact.id)

  await db.from('appointment_events')
    .delete()
    .eq('organization_id', orgId)
    .eq('contact_id', contact.id)

  await db.from('patient_contacts')
    .delete()
    .eq('organization_id', orgId)
    .eq('id', contact.id)

  return { deleted: true }
}

// ============================================================
// appointment_events
// ============================================================

export interface AppointmentEvent {
  id: string
  organization_id: string
  contact_id: string
  type: 'scheduled' | 'rescheduled' | 'cancelled'
  appointment_date: string
  appointment_time: string | null
  confidence: number
  detected_at: string
  superseded_by: string | null
}

export async function createAppointmentEvent(
  orgId: string,
  contactId: string,
  event: {
    type: AppointmentEvent['type']
    appointment_date: string
    appointment_time: string | null
    confidence: number
  }
): Promise<AppointmentEvent> {
  const { data, error } = await adminDb()
    .from('appointment_events')
    .insert({
      organization_id: orgId,
      contact_id: contactId,
      ...event,
    })
    .select()
    .single()
  if (error) throw new Error(`[wa-reviews] createAppointmentEvent falhou: ${error.message}`)
  return data as AppointmentEvent
}

// Buscar evento futuro mais proximo do contato (para cancelamento)
export async function getNextEventForContact(
  orgId: string,
  contactId: string
): Promise<AppointmentEvent | null> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await adminDb()
    .from('appointment_events')
    .select('*')
    .eq('organization_id', orgId)
    .eq('contact_id', contactId)
    .is('superseded_by', null)
    .gte('appointment_date', today)
    .neq('type', 'cancelled')
    .order('appointment_date', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data as AppointmentEvent | null
}

export async function supersedeEvent(
  orgId: string,
  eventId: string,
  supersededById: string
): Promise<void> {
  const { error } = await adminDb()
    .from('appointment_events')
    .update({ superseded_by: supersededById })
    .eq('organization_id', orgId)
    .eq('id', eventId)
  if (error) throw new Error(`[wa-reviews] supersedeEvent falhou: ${error.message}`)
}

// Verificar dedup: mesmo contato, mesma data
export async function hasEventForDate(
  orgId: string,
  contactId: string,
  date: string
): Promise<boolean> {
  const { count } = await adminDb()
    .from('appointment_events')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('contact_id', contactId)
    .eq('appointment_date', date)
    .eq('type', 'scheduled')
    .is('superseded_by', null)
  return (count ?? 0) > 0
}

// ============================================================
// review_requests
// ============================================================

export interface ReviewRequest {
  id: string
  organization_id: string
  contact_id: string
  appointment_event_id: string | null
  scheduled_for: string
  status: 'scheduled' | 'skipped' | 'sent' | 'delivered' | 'read' | 'failed'
  skip_reason: string | null
  provider_message_id: string | null
  template_name: string | null
  template_category: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  clicked_at: string | null
  cost_estimate_brl: number | null
}

export async function createReviewRequest(
  orgId: string,
  fields: {
    contact_id: string
    appointment_event_id: string
    scheduled_for: string
  }
): Promise<ReviewRequest> {
  const { data, error } = await adminDb()
    .from('review_requests')
    .insert({
      organization_id: orgId,
      ...fields,
    })
    .select()
    .single()
  if (error) throw new Error(`[wa-reviews] createReviewRequest falhou: ${error.message}`)
  return data as ReviewRequest
}

export async function skipReviewRequest(
  orgId: string,
  requestId: string,
  reason: string
): Promise<void> {
  const { error } = await adminDb()
    .from('review_requests')
    .update({ status: 'skipped', skip_reason: reason })
    .eq('organization_id', orgId)
    .eq('id', requestId)
  if (error) throw new Error(`[wa-reviews] skipReviewRequest falhou: ${error.message}`)
}

export async function updateReviewRequestStatus(
  orgId: string,
  requestId: string,
  fields: Partial<Pick<ReviewRequest, 'status' | 'provider_message_id' | 'template_name' | 'template_category' | 'sent_at' | 'delivered_at' | 'read_at' | 'clicked_at' | 'cost_estimate_brl'>>
): Promise<void> {
  const { error } = await adminDb()
    .from('review_requests')
    .update(fields)
    .eq('organization_id', orgId)
    .eq('id', requestId)
  if (error) throw new Error(`[wa-reviews] updateReviewRequestStatus falhou: ${error.message}`)
}

// Checar se houve pedido ao mesmo paciente dentro do intervalo minimo
export async function hasRecentRequest(
  orgId: string,
  contactId: string,
  minIntervalDays: number
): Promise<boolean> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - minIntervalDays)

  const { count } = await adminDb()
    .from('review_requests')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('contact_id', contactId)
    .in('status', ['scheduled', 'sent', 'delivered', 'read'])
    .gte('created_at', cutoff.toISOString())
  return (count ?? 0) > 0
}

// Contar pedidos do mes para checar teto
export async function countMonthlyRequests(
  orgId: string
): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await adminDb()
    .from('review_requests')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['sent', 'delivered', 'read'])
    .gte('sent_at', startOfMonth.toISOString())
  return count ?? 0
}

// Buscar requests agendados prontos para envio
export async function getScheduledRequestsDue(
  orgId: string,
  now: Date
): Promise<ReviewRequest[]> {
  const { data } = await adminDb()
    .from('review_requests')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'scheduled')
    .lte('scheduled_for', now.toISOString())
  return (data ?? []) as ReviewRequest[]
}

// Cancelar requests agendados para um evento
export async function cancelRequestsForEvent(
  orgId: string,
  eventId: string
): Promise<void> {
  const { error } = await adminDb()
    .from('review_requests')
    .update({ status: 'skipped', skip_reason: 'cancelled' })
    .eq('organization_id', orgId)
    .eq('appointment_event_id', eventId)
    .eq('status', 'scheduled')
  if (error) throw new Error(`[wa-reviews] cancelRequestsForEvent falhou: ${error.message}`)
}

// ============================================================
// wa_message_dedup
// ============================================================

export async function isDuplicate(
  orgId: string,
  messageIdHash: string
): Promise<boolean> {
  const { count } = await adminDb()
    .from('wa_message_dedup')
    .select('message_id_hash', { count: 'exact' })
    .eq('organization_id', orgId)
    .eq('message_id_hash', messageIdHash)
  return (count ?? 0) > 0
}

export async function markProcessed(
  orgId: string,
  messageIdHash: string
): Promise<void> {
  const { error } = await adminDb()
    .from('wa_message_dedup')
    .upsert(
      { organization_id: orgId, message_id_hash: messageIdHash },
      { onConflict: 'organization_id,message_id_hash' }
    )
  if (error) throw new Error(`[wa-reviews] markProcessed falhou: ${error.message}`)
}

// Limpeza de dedup (rodar via cron, manter 7 dias)
export async function cleanupDedup(): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)

  const { data, error } = await adminDb()
    .from('wa_message_dedup')
    .delete()
    .lt('received_at', cutoff.toISOString())
    .select('message_id_hash')
  if (error) throw new Error(`[wa-reviews] cleanupDedup falhou: ${error.message}`)
  return data?.length ?? 0
}

// ============================================================
// review_settings
// ============================================================

export interface ReviewSettings {
  organization_id: string
  send_delay_days: number
  min_interval_days: number
  monthly_cap: number
  send_window_start: string
  send_window_end: string
  timezone: string
  confidence_threshold: number
  google_review_url: string | null
}

const DEFAULT_SETTINGS: Omit<ReviewSettings, 'organization_id'> = {
  send_delay_days: 1,
  min_interval_days: 180,
  monthly_cap: 150,
  send_window_start: '09:00',
  send_window_end: '18:00',
  timezone: 'America/Sao_Paulo',
  confidence_threshold: 0.85,
  google_review_url: null,
}

export async function getSettings(orgId: string): Promise<ReviewSettings> {
  const { data } = await adminDb()
    .from('review_settings')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle()

  if (data) return data as ReviewSettings

  // Retorna defaults sem persistir (criado no onboarding/conexão)
  return { organization_id: orgId, ...DEFAULT_SETTINGS }
}

export async function upsertSettings(
  orgId: string,
  fields: Partial<Omit<ReviewSettings, 'organization_id'>>
): Promise<ReviewSettings> {
  const { data, error } = await adminDb()
    .from('review_settings')
    .upsert(
      { organization_id: orgId, ...fields },
      { onConflict: 'organization_id' }
    )
    .select()
    .single()
  if (error) throw new Error(`[wa-reviews] upsertSettings falhou: ${error.message}`)
  return data as ReviewSettings
}
