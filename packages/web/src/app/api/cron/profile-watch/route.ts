import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateCronAuth } from '@/lib/cron-auth'
import { checkProfileChanges, FIELD_LABELS } from '@/lib/gmb/profile-watch'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { resend, FROM } from '@/lib/email'
import { logger } from '@/lib/logger'

// POST /api/cron/profile-watch
// Vercel Cron: diário
// Verifica alterações nos perfis GMB e gera alertas
export async function POST(request: NextRequest) {
  const authError = validateCronAuth(request)
  if (authError) return authError

  const startedAt = Date.now()
  const db = createAdminClient()

  // Buscar todos os perfis ativos com google_location_id
  const { data: profiles, error: profilesError } = await db
    .from('gmb_profiles')
    .select('id, name, user_id, google_location_id')
    .not('google_location_id', 'is', null)

  if (profilesError) {
    logger.error('cron/profile-watch', 'erro ao buscar perfis', { err: profilesError.message })
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!profiles?.length) {
    logger.info('cron/profile-watch', 'nenhum perfil encontrado')
    return NextResponse.json({ ok: true, processed: 0 })
  }

  let processed = 0
  let alertsCreated = 0
  let errors = 0

  for (const profile of profiles) {
    let accessToken: string | null = null
    try {
      accessToken = await getValidGmbToken(profile.user_id)
    } catch (err) {
      logger.warn('cron/profile-watch', 'token indisponível, pulando perfil', {
        profileId: profile.id,
        err: String(err),
      })
      continue
    }

    try {
      const changes = await checkProfileChanges(
        db,
        profile.id,
        profile.google_location_id,
        accessToken
      )

      if (changes.length > 0) {
        // Inserir alertas
        const alertRows = changes.map(c => ({
          profile_id: profile.id,
          field: c.field,
          old_value: c.oldValue,
          new_value: c.newValue,
        }))

        await db.from('profile_alerts').insert(alertRows)
        alertsCreated += changes.length

        // Enviar email de notificação
        const { data: user } = await db
          .from('users')
          .select('email, name')
          .eq('id', profile.user_id)
          .single()

        if (user?.email) {
          const changesList = changes.map(c => {
            const label = FIELD_LABELS[c.field] ?? c.field
            return `- ${label}: "${c.oldValue ?? '(vazio)'}" → "${c.newValue ?? '(vazio)'}"`
          }).join('\n')

          await resend.emails.send({
            from: FROM,
            to: user.email,
            subject: `Destaka: alteração detectada no perfil "${profile.name}"`,
            text: [
              `Olá${user.name ? ` ${user.name}` : ''},`,
              '',
              `Detectamos alterações no seu perfil "${profile.name}" no Google Meu Negócio:`,
              '',
              changesList,
              '',
              'Se você autorizou essas mudanças, pode ignorar este email.',
              'Se não reconhece essas alterações, acesse seu painel Destaka para verificar.',
              '',
              'Equipe Destaka',
            ].join('\n'),
          }).catch(emailErr => {
            logger.warn('cron/profile-watch', 'falha ao enviar email', {
              profileId: profile.id,
              err: String(emailErr),
            })
          })
        }
      }

      processed++
    } catch (err) {
      logger.error('cron/profile-watch', 'erro ao verificar perfil', {
        profileId: profile.id,
        err: String(err),
      })
      errors++
    }
  }

  const summary = {
    ok: true,
    duration_ms: Date.now() - startedAt,
    processed,
    alerts_created: alertsCreated,
    errors,
  }

  logger.info('cron/profile-watch', 'concluído', summary)
  return NextResponse.json(summary)
}
