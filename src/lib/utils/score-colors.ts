/**
 * Utilitarios compartilhados para cores e labels de score.
 * Breakpoints unificados: >= 70 verde, >= 40 amarelo, < 40 vermelho/laranja.
 */

export function getScoreColor(score: number): string {
  if (score >= 90) return '#3b82f6'
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Excelente'
  if (score >= 40) return 'Bom'
  return 'Precisa melhorar'
}
