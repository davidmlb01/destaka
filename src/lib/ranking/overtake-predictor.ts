/**
 * Story 5.5: Previsão de Ultrapassagem
 * Calcula semanas estimadas para ultrapassar cada concorrente
 * baseado na velocidade real de reviews (reviews/semana)
 */

interface VelocityData {
  name: string
  currentCount: number
  weeklyVelocity: number
  isSelf: boolean
}

interface OvertakePrediction {
  competitorName: string
  competitorCount: number
  userCount: number
  gap: number
  weeksToOvertake: number | null // null = não vai ultrapassar no ritmo atual
  userVelocity: number
  competitorVelocity: number
}

export function predictOvertake(entries: VelocityData[]): OvertakePrediction[] {
  const self = entries.find(e => e.isSelf)
  if (!self) return []

  const competitors = entries.filter(e => !e.isSelf)
  const predictions: OvertakePrediction[] = []

  for (const comp of competitors) {
    const gap = comp.currentCount - self.currentCount
    const velocityDiff = self.weeklyVelocity - comp.weeklyVelocity

    let weeksToOvertake: number | null = null

    if (gap <= 0) {
      // Já está à frente
      weeksToOvertake = 0
    } else if (velocityDiff > 0) {
      // Está ganhando terreno
      weeksToOvertake = Math.ceil(gap / velocityDiff)
    }
    // Se velocityDiff <= 0, nunca vai ultrapassar (null)

    predictions.push({
      competitorName: comp.name,
      competitorCount: comp.currentCount,
      userCount: self.currentCount,
      gap,
      weeksToOvertake,
      userVelocity: self.weeklyVelocity,
      competitorVelocity: comp.weeklyVelocity,
    })
  }

  return predictions.sort((a, b) => {
    // Já ultrapassou primeiro, depois por semanas (menos primeiro), depois nunca
    if (a.weeksToOvertake === 0) return -1
    if (b.weeksToOvertake === 0) return 1
    if (a.weeksToOvertake === null && b.weeksToOvertake === null) return a.gap - b.gap
    if (a.weeksToOvertake === null) return 1
    if (b.weeksToOvertake === null) return -1
    return a.weeksToOvertake - b.weeksToOvertake
  })
}

export function formatOvertakeTime(weeks: number | null): string {
  if (weeks === null) return 'No ritmo atual, não ultrapassa'
  if (weeks === 0) return 'Você já está à frente'
  if (weeks <= 4) return `~${weeks} semanas`
  const months = Math.round(weeks / 4.3)
  return months === 1 ? '~1 mês' : `~${months} meses`
}
