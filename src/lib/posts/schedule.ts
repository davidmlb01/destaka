/**
 * Calcula o proximo slot de publicacao disponivel (segunda, quarta ou sexta as 10h BRT / 13h UTC).
 * Se hoje for um dia de publicacao e ainda nao passou das 13h UTC, usa hoje.
 * Senao, avanca pro proximo dia valido.
 */
export function getNextPublishSlot(existingScheduledDates: string[] = []): Date {
  const PUBLISH_DAYS = [1, 3, 5] // segunda, quarta, sexta
  const PUBLISH_HOUR_UTC = 13 // 10h BRT

  const now = new Date()
  const scheduledSet = new Set(existingScheduledDates.map(d => d.split('T')[0]))

  const candidate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    PUBLISH_HOUR_UTC,
    0,
    0
  ))

  // Se hoje e dia valido e ainda nao passou do horario, tenta hoje
  if (PUBLISH_DAYS.includes(candidate.getUTCDay()) && candidate > now) {
    const dateKey = candidate.toISOString().split('T')[0]
    if (!scheduledSet.has(dateKey)) return candidate
  }

  // Avanca dia a dia ate encontrar um slot livre
  for (let i = 1; i <= 14; i++) {
    const next = new Date(candidate.getTime() + i * 24 * 60 * 60 * 1000)
    if (!PUBLISH_DAYS.includes(next.getUTCDay())) continue
    const dateKey = next.toISOString().split('T')[0]
    if (!scheduledSet.has(dateKey)) return next
  }

  // Fallback: 7 dias a partir de agora
  const fallback = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  fallback.setUTCHours(PUBLISH_HOUR_UTC, 0, 0, 0)
  return fallback
}

/**
 * Formata a data de agendamento para exibicao no dashboard.
 * Ex: "segunda (18/11) as 10h"
 */
export function formatScheduleLabel(date: Date): string {
  const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
  const brt = new Date(date.getTime() - 3 * 60 * 60 * 1000)
  const day = weekdays[brt.getUTCDay()]
  const dd = String(brt.getUTCDate()).padStart(2, '0')
  const mm = String(brt.getUTCMonth() + 1).padStart(2, '0')
  const hh = String(brt.getUTCHours()).padStart(2, '0')
  return `${day} (${dd}/${mm}) às ${hh}h`
}
