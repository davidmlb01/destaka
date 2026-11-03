export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getZernioAccountId, probeAnalytics } from '@/lib/zernio/client'
import { inngest } from '@/lib/inngest/client'

// GET /api/zernio/callback
// Zernio redireciona aqui apos usuario autorizar Google Business Profile.
// Busca o account criado, salva no banco, dispara collectors.
export async function GET(req: NextRequest) {
  const origin = 'https://destaka.com.br'

  try {
    const admin = createAdminSupa(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Zernio envia profileId no state ou como query param apos callback
    // O flow padrao redireciona de volta com os dados ja persistidos no Zernio
    // Precisamos buscar todas as orgs com zernio_profile_id mas sem zernio_account_id
    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, zernio_profile_id')
      .not('zernio_profile_id', 'is', null)
      .is('zernio_account_id', null)

    if (!orgs?.length) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    for (const org of orgs) {
      const accountId = await getZernioAccountId(org.zernio_profile_id)
      if (accountId) {
        await admin
          .from('organizations')
          .update({ zernio_account_id: accountId })
          .eq('id', org.id)

        console.log(`[zernio-callback] Account ${accountId} salvo para org ${org.id} (${org.name})`)

        // Probe analytics automatico
        const probe = await probeAnalytics(accountId)
        console.log(`[zernio-callback] Analytics probe org ${org.id}: available=${probe.available}`)

        // Disparar collectors agora que Zernio esta conectado
        inngest.send([
          { name: 'destaka/performance.collect.requested', data: { organization_id: org.id } },
          { name: 'destaka/gbp.audit.requested', data: { organization_id: org.id } },
          { name: 'destaka/score.calculate.requested', data: { organization_id: org.id } },
        ]).catch(() => {})
      }
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error('[zernio-callback] Error:', err)
    return NextResponse.redirect(`${origin}/dashboard`)
  }
}
