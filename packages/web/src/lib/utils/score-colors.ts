/**
 * Utilitarios compartilhados para cores e labels de score.
 * Breakpoints unificados: >= 70 verde, >= 40 amarelo, < 40 vermelho/laranja.
 */

export function getScoreColor(score: number): string {
  if (score >= 70) return '#4ADE80'
  if (score >= 40) return '#FBBF24'
  return '#FB923C'
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Excelente'
  if (score >= 40) return 'Bom'
  return 'Precisa melhorar'
}
