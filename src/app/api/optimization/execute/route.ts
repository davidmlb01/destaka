export const dynamic = 'force-dynamic'

// Executa otimizacoes reais no perfil GBP via API
import { NextRequest, NextResponse } from 'next/server'
import { getAuthOrg } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { generateContent } from '@/lib/ai/client'
import { rateLimitStrict } from '@/lib/redis'
import type { OptimizationAction, ExecutionResult } from '@/lib/gmb/optimizer'

const GBP_INFO_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1'

function createServiceClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { user, orgId, supabase } = auth

  const body = await request.json() as {
    profileId: string
    diagnosticId: string
    actions: OptimizationAction[]
  }

  if (!body.actions?.length) {
    return NextResponse.json({ error: 'Nenhuma acao para executar' }, { status: 400 })
  }
  const admin = createServiceClient()

  // Buscar org + location
  const { data: org } = await admin
    .from('organizations')
    .select('gbp_location_id, name, specialty')
    .eq('id', orgId)
    .single()

  if (!org?.gbp_location_id) {
    return NextResponse.json({ error: 'Location GBP não configurado' }, { status: 500 })
  }

  // Token com refresh
  let accessToken: string
  try {
    accessToken = await getValidGmbToken(user.id)
  } catch {
    return NextResponse.json({ error: 'Token Google expirado. Reconecte sua conta.' }, { status: 401 })
  }

  const locationName = org.gbp_location_id
  const results: ExecutionResult[] = []

  for (const action of body.actions) {
    try {
      if (action.type === 'update_description') {
        // Rate limit: 3 chamadas Claude por hora por org (descricao)
        try {
          const rlCount = await rateLimitStrict(`claude:desc:${orgId}`, 3600)
          if (rlCount > 3) {
            results.push({ action, status: 'failed', error: 'Limite de gerações de descrição atingido. Tente novamente em 1 hora.' })
            continue
          }
        } catch {
          results.push({ action, status: 'failed', error: 'Serviço de limite de requisições indisponível. Tente novamente em instantes.' })
          continue
        }

        // Gerar descricao via Claude
        const prompt = `Escreva uma descricao profissional para o Google Meu Negocio.
Empresa: ${org.name}, ${org.specialty}.
Maximo 750 caracteres. Em portugues brasileiro. Tom profissional e acolhedor.
Inclua keywords de SEO local. Sem travessao. Retorne APENAS o texto da descricao.`

        const description = await generateContent(prompt, 'Voce e especialista em SEO local para Google Business Profile.')

        if (description && description.length >= 50) {
          const res = await fetch(
            `${GBP_INFO_BASE}/${locationName}?updateMask=profile.description`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ profile: { description: description.trim() } }),
            }
          )

          if (res.ok) {
            await admin.from('gbp_profiles')
              .update({ description: description.trim() })
              .eq('organization_id', orgId)
              .eq('location_id', locationName)

            results.push({ action, status: 'done', payload: { description: description.trim() } })
          } else {
            const errBody = await res.text()
            console.error('[optimization/execute] GBP PATCH description error:', errBody)
            results.push({ action, status: 'failed', error: 'Falha ao atualizar descricao no Google' })
          }
        } else {
          results.push({ action, status: 'failed', error: 'IA não gerou descrição válida' })
        }
      } else if (action.type === 'update_categories' || action.type === 'update_attributes' || action.type === 'add_services') {
        // Delega para a rota /api/gbp/optimize/apply que faz PATCH real na GBP API
        const typeMap: Record<string, string> = {
          update_categories: 'categories',
          update_attributes: 'attributes',
          add_services: 'services',
        }
        const applyRes = await fetch(new URL('/api/gbp/optimize/apply', request.url), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: request.headers.get('cookie') ?? '',
          },
          body: JSON.stringify({ type: typeMap[action.type], value: action.payload }),
        })
        if (applyRes.ok) {
          results.push({ action, status: 'done' })
        } else {
          const errData = await applyRes.json().catch(() => ({ error: 'Falha na API' }))
          results.push({ action, status: 'failed', error: (errData as { error?: string }).error ?? 'Falha ao aplicar no Google' })
        }
      } else {
        results.push({ action, status: 'failed', error: `Tipo '${action.type}' ainda não suportado` })
      }
    } catch (err) {
      console.error(`[optimization/execute] Action ${action.type} error:`, err)
      results.push({ action, status: 'failed', error: 'Erro ao executar acao' })
    }
  }

  // Buscar score atual
  const { data: latestScore } = await supabase
    .from('scores')
    .select('total')
    .eq('organization_id', orgId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const scoreBefore = latestScore?.total ?? 0
  const successfulGain = results
    .filter(r => r.status === 'done')
    .reduce((sum, r) => sum + r.action.impact, 0)
  const scoreAfter = Math.min(100, scoreBefore + successfulGain)

  // Disparar recalculo de score
  const { inngest } = await import('@/lib/inngest/client')
  await inngest.send({
    name: 'destaka/score.calculate.requested',
    data: { organization_id: orgId },
  })

  return NextResponse.json({ results, scoreBefore, scoreAfter })
}
