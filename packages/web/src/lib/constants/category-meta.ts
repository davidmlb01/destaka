/**
 * Metadados unificados por categoria de score GMB.
 * Substitui as constantes CATEGORY_ICONS duplicadas em 4+ componentes.
 */

interface CategoryMeta {
  icon: string
  label: string
  color: string
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  info: { icon: '📋', label: 'Informações', color: '#60A5FA' },
  completude: { icon: '📋', label: 'Completude', color: '#60A5FA' },
  photos: { icon: '📸', label: 'Fotos', color: '#F472B6' },
  reviews: { icon: '⭐', label: 'Avaliações', color: '#FBBF24' },
  reputation: { icon: '⭐', label: 'Reputação', color: '#FBBF24' },
  posts: { icon: '📝', label: 'Posts', color: '#34D399' },
  activity: { icon: '📝', label: 'Atividade', color: '#34D399' },
  services: { icon: '🏥', label: 'Serviços', color: '#A78BFA' },
  attributes: { icon: '✅', label: 'Atributos', color: '#4ADE80' },
  verification: { icon: '✅', label: 'Verificação', color: '#4ADE80' },
}

export function getCategoryIcon(name: string): string {
  return CATEGORY_META[name]?.icon ?? '📊'
}
