// Phase 8: Pedido de indicacao no momento certo
// Trigger: destaka/rank.improved
// Envia WhatsApp quando o perfil melhora de posicao/visibilidade
// Limite: 1 pedido por organizacao a cada 30 dias

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { createWhatsAppClient } from '@/lib/whatsapp/client'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const REFERRAL_COOLDOWN_DAYS = 30
const ALERT_TYPE = 'referral_request'

export const referralTrigger = inngest.createFunction(
  {
    id: 'referral-trigger',
    triggers: [{ event: 'destaka/rank.improved' }],
  },
  async ({ event, step }) => {
    const db = admin()
    const data = (event as unknown as {
      data: {
        organization_id: string
        improvement_type: string
        detail: string
        total_searches?: number
      }
    }).data

    const orgId = data.organization_id

    // 1. Verificar se ja enviou pedido de indicacao nos ultimos 30 dias
    const eligible = await step.run('check-cooldown', async () => {
      const cutoff = new Date(
        Date.now() - REFERRAL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
      ).toISOString()

      const { data: recentAlert } = await db
        .from('alerts_sent')
        .select('id')
        .eq('organization_id', orgId)
        .eq('alert_type', ALERT_TYPE)
        .gte('sent_at', cutoff)
        .limit(1)
        .maybeSingle()

      if (recentAlert) {
        console.log(
          `[referral-trigger] Org ${orgId}: pedido de indicacao ja enviado nos ultimos ${REFERRAL_COOLDOWN_DAYS} dias, pulando`
        )
        return false
      }

      return true
    })

    if (!eligible) {
      return { status: 'skipped', reason: 'cooldown ativo' }
    }

    // 2. Verificar se o owner tem codigo de indicacao
    const refData = await step.run('fetch-referral-data', async () => {
      // Buscar professional owner
      const { data: prof } = await db
        .from('professionals')
        .select('user_id, name')
        .eq('organization_id', orgId)
        .maybeSingle()

      if (!prof?.user_id) {
        return null
      }

      // Buscar codigo de indicacao ativo
      const { data: refCode } = await db
        .from('referral_codes')
        .select('code')
        .eq('owner_user_id', prof.user_id)
        .eq('owner_type', 'client')
        .eq('active', true)
        .maybeSingle()

      if (!refCode?.code) {
        return null
      }

      // Buscar telefone e nome da organizacao
      const { data: org } = await db
        .from('organizations')
        .select('name, phone')
        .eq('id', orgId)
        .single()

      return {
        code: refCode.code,
        orgName: org?.name ?? 'Sua clinica',
        phone: org?.phone ?? null,
        userId: prof.user_id,
      }
    })

    if (!refData) {
      return { status: 'skipped', reason: 'sem codigo de indicacao ou professional' }
    }

    if (!refData.phone) {
      return { status: 'skipped', reason: 'telefone nao cadastrado' }
    }

    // 3. Montar e enviar mensagem
    const result = await step.run('send-referral-request', async () => {
      const whatsapp = createWhatsAppClient()

      const totalSearches = data.total_searches ?? 0
      const searchesText =
        totalSearches > 0 ? `${totalSearches} pessoas encontraram voce pelo Google este mes.` : ''

      // Mensagem personalizada com resultado real como prova social
      const params: Record<string, string> = {
        '1': refData.orgName,
        '2': data.detail,
        '3': searchesText,
        '4': `destaka.com.br/?ref=${refData.code}`,
      }

      try {
        await whatsapp.sendMessage(
          refData.phone,
          'destaka_referral_rank_gain',
          params
        )

        // Registrar alerta enviado para controle de cooldown
        await db.from('alerts_sent').insert({
          organization_id: orgId,
          alert_type: ALERT_TYPE,
          reference_id: data.improvement_type,
          email_to: refData.phone,
        })

        console.log(
          `[referral-trigger] Pedido de indicacao enviado para org ${orgId} (${refData.orgName})`
        )
        return { status: 'sent', code: refData.code }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error(
          `[referral-trigger] Falha ao enviar para org ${orgId}:`,
          errorMsg
        )
        return { status: 'error', error: errorMsg }
      }
    })

    return { organization_id: orgId, ...result }
  }
)
