// EPIC-010: Helper para enviar alerta de token desconectado
// Limita a 1 alerta por org a cada 24h

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { sendTokenDisconnectedAlert } from '@/lib/email/token-alert'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function handleTokenFailure(orgId: string): Promise<void> {
  const db = admin()

  try {
    // Verifica se ja enviou alerta nas ultimas 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentAlert } = await db
      .from('alerts_sent')
      .select('id')
      .eq('organization_id', orgId)
      .eq('alert_type', 'token_disconnected')
      .gte('sent_at', twentyFourHoursAgo)
      .limit(1)
      .maybeSingle()

    if (recentAlert) {
      console.log(`[token-alert] Alerta ja enviado nas ultimas 24h para org ${orgId}, pulando`)
      return
    }

    // Busca email do profissional owner
    const { data: prof } = await db
      .from('professionals')
      .select('email')
      .eq('organization_id', orgId)
      .eq('role', 'owner')
      .maybeSingle()

    if (!prof?.email) {
      console.warn(`[token-alert] Nenhum email de owner encontrado para org ${orgId}`)
      return
    }

    // Busca nome da organizacao
    const { data: org } = await db
      .from('organizations')
      .select('name, specialty')
      .eq('id', orgId)
      .single()

    const orgName = org?.name ?? 'sua clinica'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'
    const dashboardUrl = `${appUrl}/dashboard/settings`

    await sendTokenDisconnectedAlert({
      to: prof.email,
      orgName,
      dashboardUrl,
      specialty: (org?.specialty as string) ?? null,
    })

    // Registra alerta enviado
    await db.from('alerts_sent').insert({
      organization_id: orgId,
      alert_type: 'token_disconnected',
      email_to: prof.email,
    })

    console.log(`[token-alert] Alerta de token desconectado enviado para ${prof.email} (org ${orgId})`)
  } catch (err) {
    console.error('[token-alert] Falha ao processar alerta de token:', err instanceof Error ? err.message : err)
  }
}
