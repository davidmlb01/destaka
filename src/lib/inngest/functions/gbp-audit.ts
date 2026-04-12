import { cron } from 'inngest'
import { inngest } from '../client'

export const gbpAudit = inngest.createFunction(
  { id: 'gbp-audit', triggers: [cron('0 9 * * 1')] },
  async ({ event, step }) => {
    // TODO Story 002: auditoria de categorias, atributos, servicos, descricao, fotos
    return { status: 'not_implemented' }
  }
)
