// WhatsApp Review Automation: processador de webhooks
// Recebe eventos normalizados, atualiza contatos, encaminha para detecao.
// REGRA: texto de mensagem NUNCA e gravado em banco, log, fila ou erro.

import crypto from 'crypto'
import { logger } from '@/lib/logger'
import * as defaultDb from './db'
import type { PatientContact } from './db'
import type { NormalizedEvent } from './provider'

// ============================================================
// Resultado do processamento
// ============================================================

export interface ProcessResult {
  event_id: string
  action: 'processed' | 'duplicate' | 'ignored' | 'error'
  reason?: string
  // Dados para a Fase 4 (detecao): texto em memoria, descartado apos uso
  detection_payload?: {
    organization_id: string
    contact_id: string
    text: string
    direction: 'clinic' | 'patient'
    message_timestamp: Date
  }
}

// ============================================================
// Dependencias injetaveis (para testes sem banco real)
// ============================================================

export interface WebhookDeps {
  isDuplicate: (orgId: string, hash: string) => Promise<boolean>
  markProcessed: (orgId: string, hash: string) => Promise<void>
  upsertContact: (orgId: string, phone: string, name: string | null) => Promise<PatientContact>
  updateConnectionStatus: (orgId: string, status: string, extra?: Record<string, unknown>) => Promise<void>
}

const defaultDeps: WebhookDeps = {
  isDuplicate: defaultDb.isDuplicate,
  markProcessed: defaultDb.markProcessed,
  upsertContact: defaultDb.upsertContact,
  updateConnectionStatus: defaultDb.updateConnectionStatus as (orgId: string, status: string, extra?: Record<string, unknown>) => Promise<void>,
}

// ============================================================
// Palavras de opt-out
// ============================================================

const OPT_OUT_KEYWORDS = ['sair', 'parar', 'cancelar inscricao', 'nao quero receber']

export function isOptOut(text: string | null): boolean {
  if (!text) return false
  const normalized = text.trim().toLowerCase()
  return OPT_OUT_KEYWORDS.some(kw => normalized === kw)
}

// ============================================================
// Processador principal
// ============================================================

export async function processWebhookEvent(
  orgId: string,
  event: NormalizedEvent,
  deps: WebhookDeps = defaultDeps
): Promise<ProcessResult> {
  const eventIdHash = crypto.createHash('sha256').update(event.message_id).digest('hex')

  // 1. Idempotencia: checar se ja processamos esse evento
  const dup = await deps.isDuplicate(orgId, eventIdHash)
  if (dup) {
    return { event_id: event.message_id, action: 'duplicate' }
  }

  // 2. Marcar como processado (antes de qualquer logica, para idempotencia)
  await deps.markProcessed(orgId, eventIdHash)

  // 3. Ignorar grupos
  if (event.is_group) {
    return { event_id: event.message_id, action: 'ignored', reason: 'group' }
  }

  // 4. Ignorar mensagens enviadas pela API do Destaka
  if (event.is_from_api) {
    return { event_id: event.message_id, action: 'ignored', reason: 'api_sent' }
  }

  // 5. Ignorar midia sem texto
  if (event.media_type && !event.text) {
    return { event_id: event.message_id, action: 'ignored', reason: 'media_only' }
  }

  // 6. Tratar eventos de conexao
  if (event.type === 'connection_changed') {
    return handleConnectionChanged(orgId, event, deps)
  }

  // 7. Tratar eventos de status de entrega
  if (event.type === 'delivery_status') {
    // Status de entrega sera tratado na Fase 5 (atualiza review_requests)
    // Por enquanto, apenas logar sem o texto
    logger.info('wa-webhook', `Status de entrega: ${event.delivery_status}`, { orgId })
    return { event_id: event.message_id, action: 'processed', reason: 'delivery_status' }
  }

  // 8. Mensagem recebida ou eco: criar/atualizar contato
  if (event.type === 'message_received' || event.type === 'echo_sent') {
    return handleMessage(orgId, event, deps)
  }

  return { event_id: event.message_id, action: 'ignored', reason: 'unknown_type' }
}

// ============================================================
// Handler: mensagem recebida ou eco
// ============================================================

async function handleMessage(
  orgId: string,
  event: NormalizedEvent,
  deps: WebhookDeps
): Promise<ProcessResult> {
  // Criar ou atualizar contato (telefone, nome, timestamp)
  const contact = await deps.upsertContact(orgId, event.phone, event.contact_name)

  // Checar opt-out ANTES de encaminhar para detecao
  if (event.type === 'message_received' && isOptOut(event.text)) {
    // Opt-out sera implementado na Fase 5 (optOutContact + cancelar requests)
    // Por enquanto, marcar no resultado
    logger.info('wa-webhook', 'Opt-out detectado', { orgId, contactId: contact.id })
    return {
      event_id: event.message_id,
      action: 'processed',
      reason: 'opt_out',
    }
  }

  // Se tem texto, preparar payload para detecao (Fase 4)
  // O texto fica APENAS neste objeto em memoria. Nao e gravado em lugar nenhum.
  if (event.text) {
    const direction: 'clinic' | 'patient' =
      event.type === 'echo_sent' ? 'clinic' : 'patient'

    return {
      event_id: event.message_id,
      action: 'processed',
      detection_payload: {
        organization_id: orgId,
        contact_id: contact.id,
        text: event.text,
        direction,
        message_timestamp: event.timestamp,
      },
    }
  }

  // Sem texto (ex: sticker, contato compartilhado)
  return { event_id: event.message_id, action: 'processed', reason: 'no_text' }
}

// ============================================================
// Handler: mudanca de conexao
// ============================================================

async function handleConnectionChanged(
  orgId: string,
  event: NormalizedEvent,
  deps: WebhookDeps
): Promise<ProcessResult> {
  if (event.connection_status === 'connected') {
    await deps.updateConnectionStatus(orgId, 'active', {
      last_event_at: event.timestamp.toISOString(),
      connected_at: event.timestamp.toISOString(),
    })
    logger.info('wa-webhook', 'Conexao ativada', { orgId })
  } else if (event.connection_status === 'disconnected') {
    await deps.updateConnectionStatus(orgId, 'disconnected', {
      last_event_at: event.timestamp.toISOString(),
      disconnected_at: event.timestamp.toISOString(),
    })
    logger.info('wa-webhook', 'Conexao desconectada', { orgId })
  }

  return { event_id: event.message_id, action: 'processed', reason: 'connection_update' }
}

// ============================================================
// Processar batch de eventos de um webhook
// ============================================================

export async function processWebhookBatch(
  orgId: string,
  events: NormalizedEvent[],
  deps: WebhookDeps = defaultDeps
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = []

  for (const event of events) {
    try {
      const result = await processWebhookEvent(orgId, event, deps)
      results.push(result)
    } catch (err) {
      // NUNCA logar o evento raw (pode conter texto)
      const msg = err instanceof Error ? err.message : 'unknown'
      logger.error('wa-webhook', `Erro ao processar evento ${event.message_id}: ${msg}`, { orgId })
      results.push({
        event_id: event.message_id,
        action: 'error',
        reason: msg,
      })
    }
  }

  return results
}
