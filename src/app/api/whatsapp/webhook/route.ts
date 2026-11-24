// WhatsApp Review Automation: rota de webhook
// Recebe eventos do parceiro, valida assinatura, processa sem gravar texto.
// REGRA: o body da request NUNCA e logado, retornado em erro, ou persistido.

import { NextRequest, NextResponse } from 'next/server'
import { createReviewProvider } from '@/lib/wa-reviews/provider'
import { processWebhookBatch } from '@/lib/wa-reviews/webhook-processor'
import { getConnection } from '@/lib/wa-reviews/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Resolver orgId a partir do phone_number_id do webhook
// Na Fase 6, isso vira lookup real. Por enquanto, aceita orgId no query string (dev/test).
async function resolveOrgId(
  request: NextRequest,
  _body: string
): Promise<string | null> {
  // Dev/test: orgId no query string
  const orgFromQuery = request.nextUrl.searchParams.get('org_id')
  if (orgFromQuery) return orgFromQuery

  // Producao: extrair phone_number_id do payload e fazer lookup
  // Implementado na Fase 6 com o parceiro real
  return null
}

export async function POST(request: NextRequest) {
  // 1. Ler body como texto (para validar assinatura antes de parsear)
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  // 2. Responder 200 rapido para o parceiro (processar em seguida)
  // Em producao com Inngest, o processamento vai para background.
  // Aqui processamos sincrono para manter a Fase 3 simples.

  // 3. Criar provider
  const provider = createReviewProvider()

  // 4. Validar assinatura do webhook
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  if (!provider.verifyWebhook(headers, rawBody)) {
    logger.warn('wa-webhook', 'Assinatura de webhook invalida')
    // NAO logar o body
    return NextResponse.json({ error: 'Assinatura invalida' }, { status: 401 })
  }

  // 5. Resolver orgId
  const orgId = await resolveOrgId(request, rawBody)
  if (!orgId) {
    logger.warn('wa-webhook', 'Nao foi possivel resolver organization_id')
    return NextResponse.json({ error: 'Organizacao nao identificada' }, { status: 400 })
  }

  // 6. Verificar que a conexao existe
  const connection = await getConnection(orgId)
  if (!connection) {
    logger.warn('wa-webhook', 'Webhook para organizacao sem conexao', { orgId })
    return NextResponse.json({ error: 'Conexao nao encontrada' }, { status: 404 })
  }

  // 7. Parsear eventos
  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
  }

  const events = provider.parseEvents(payload)
  if (events.length === 0) {
    return NextResponse.json({ received: true, processed: 0 })
  }

  // 8. Processar batch
  const results = await processWebhookBatch(orgId, events)

  // 9. Contar resultados (sem expor detalhes dos eventos)
  const summary = {
    received: true,
    total: results.length,
    processed: results.filter(r => r.action === 'processed').length,
    duplicates: results.filter(r => r.action === 'duplicate').length,
    ignored: results.filter(r => r.action === 'ignored').length,
    errors: results.filter(r => r.action === 'error').length,
  }

  logger.info('wa-webhook', `Batch processado: ${summary.processed}/${summary.total}`, { orgId })

  // 10. Retornar resumo sem dados sensiveis
  // O body original (rawBody) sai de escopo aqui e sera coletado pelo GC.
  return NextResponse.json(summary)
}
