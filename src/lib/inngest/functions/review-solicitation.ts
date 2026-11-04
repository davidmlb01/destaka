// Motor de Ranking: Pedido ativo de reviews
// Envia email ao profissional com link de review para compartilhar com clientes recentes.
// Cron: toda quarta-feira as 9h UTC (meio da semana, melhor taxa de resposta)
// Principio: volume de reviews e o fator #1 de ranking local.

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { inngest } from '../client'
import { resend, FROM } from '@/lib/email/index'
import { getBrandName } from '@/lib/vertical-vocab'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const reviewSolicitation = inngest.createFunction(
  {
    id: 'review-solicitation',
    triggers: [
      { cron: '0 9 * * 3' }, // Quarta 9h UTC
      { event: 'destaka/reviews.solicitation.requested' },
    ],
  },
  async ({ event, step }) => {
    const db = admin()

    const orgIds: string[] = await step.run('resolve-orgs', async () => {
      const eventData = (event as unknown as { data?: { organization_id?: string } }).data
      if (event.name === 'destaka/reviews.solicitation.requested' && eventData?.organization_id) {
        return [eventData.organization_id]
      }
      // Apenas orgs com assinatura ativa
      const { data } = await db.from('google_tokens').select('organization_id')
      return (data ?? []).map((r: { organization_id: string }) => r.organization_id)
    })

    const results: Array<{ org_id: string; status: string; error?: string }> = []

    for (const orgId of orgIds) {
      const result = await step.run(`solicit-reviews-${orgId}`, async () => {
        try {
          // Buscar dados da org
          const { data: org } = await db
            .from('organizations')
            .select('name, specialty')
            .eq('id', orgId)
            .maybeSingle()

          if (!org?.name) return { org_id: orgId, status: 'skip', error: 'org sem nome' }

          // Buscar profissional (email)
          const { data: prof } = await db
            .from('professionals')
            .select('email, name, user_id')
            .eq('organization_id', orgId)
            .eq('role', 'owner')
            .maybeSingle()

          if (!prof?.email) return { org_id: orgId, status: 'skip', error: 'sem email do profissional' }

          // Buscar google_location_id para gerar link de review
          const { data: gmbProfile } = await db
            .from('gmb_profiles')
            .select('google_location_id')
            .eq('user_id', prof.user_id)
            .maybeSingle()

          // Link de review do Google: search?q=<nome>&hl=pt-BR#lrd=<place_id>,3,,,
          // Alternativa mais confiavel: link do Maps
          const reviewLink = gmbProfile?.google_location_id
            ? `https://search.google.com/local/writereview?placeid=${gmbProfile.google_location_id.replace('locations/', '')}`
            : `https://www.google.com/search?q=${encodeURIComponent(org.name)}+avaliar`

          // Contar reviews atuais
          const { count: reviewCount } = await db
            .from('reviews')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)

          // Buscar posicao no ranking (se disponivel)
          const { data: rankingPos } = await db
            .from('ranking_positions')
            .select('position, top_competitor_name, top_competitor_reviews')
            .eq('organization_id', orgId)
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .maybeSingle()

          const position = rankingPos?.position ?? null
          const topCompetitor = rankingPos?.top_competitor_name ?? null
          const topCompetitorReviews = rankingPos?.top_competitor_reviews ?? 0
          const gap = topCompetitorReviews - (reviewCount ?? 0)

          const brandName = getBrandName((org.specialty as string) ?? 'saude')
          const profName = prof.name?.split(' ')[0] ?? 'Profissional'

          // Email com contexto de ranking
          const subject = position && position > 1
            ? `${profName}, cada avaliação te aproxima do 1º lugar no Google`
            : `${profName}, suas avaliações fortalecem seu perfil no Google`

          const positionContext = position
            ? `<p style="margin:0 0 12px;font-size:14px;color:#4B5563;">Hoje você está na <strong>${position}ª posição</strong> quando alguém busca no Google.${topCompetitor && position > 1 ? ` O 1º lugar é ${topCompetitor}.` : ''}</p>`
            : ''

          const gapContext = position && position > 1
            ? `<p style="margin:0 0 12px;font-size:14px;color:#4B5563;">O ${brandName} está trabalhando para subir sua posição: publicando posts, respondendo avaliações e otimizando seu perfil. Avaliações de pacientes reais são o complemento mais forte que você pode adicionar.</p>`
            : ''

          const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
  <p style="margin:0 0 20px;font-size:16px;color:#111827;">Olá, ${profName}!</p>

  ${positionContext}
  ${gapContext}

  <p style="margin:0 0 12px;font-size:14px;color:#4B5563;">A melhor forma de subir no Google é pedir avaliações aos seus pacientes. Uma mensagem simples no WhatsApp funciona:</p>

  <div style="background:#F3F4F6;border-radius:12px;padding:16px;margin:16px 0;">
    <p style="margin:0;font-size:14px;color:#374151;font-style:italic;">
      "Olá! Obrigado(a) por confiar no meu trabalho. Se puder, deixar uma avaliação no Google me ajuda muito a ajudar mais pessoas como você: ${reviewLink}"
    </p>
  </div>

  <p style="margin:0 0 8px;font-size:14px;color:#4B5563;">Envie para 3 a 5 pacientes recentes. Leva 30 segundos e faz diferença real.</p>

  <div style="text-align:center;margin:24px 0;">
    <a href="${reviewLink}" style="display:inline-block;background:#14B8A6;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
      Testar o link de avaliação
    </a>
  </div>

  <p style="margin:24px 0 0;font-size:12px;color:#9CA3AF;">
    Você tem ${reviewCount ?? 0} avaliações. ${brandName} cuida do resto no piloto automático.
  </p>
</div>`

          await resend.emails.send({
            from: FROM,
            to: prof.email,
            subject,
            html,
          })

          console.log(`[review-solicitation] Email enviado para ${prof.email} (org ${orgId}, pos ${position}, gap ${gap})`)
          return { org_id: orgId, status: 'ok' }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'unknown'
          console.error(`[review-solicitation] Erro org ${orgId}: ${msg}`)
          return { org_id: orgId, status: 'error', error: msg }
        }
      })
      results.push(result)
    }

    return { processed: results.length, results }
  }
)
