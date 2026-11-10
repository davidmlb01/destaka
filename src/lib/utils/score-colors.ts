/**
 * Cores e labels de score. 3 niveis: verde, amarelo, vermelho.
 */

export function getScoreColor(score: number): string {
  if (score >= 70) return '#4ADE80'
  if (score >= 40) return '#FBBF24'
  return '#F87171'
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Excelente'
  if (score >= 40) return 'Bom'
  return 'Precisa melhorar'
}
