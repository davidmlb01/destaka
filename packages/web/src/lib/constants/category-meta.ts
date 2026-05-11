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
  info: { icon: '📋', label: 'Informações', color: 'var(--accent)' },
  completude: { icon: '📋', label: 'Completude', color: 'var(--accent)' },
  photos: { icon: '📸', label: 'Fotos', color: 'var(--accent)' },
  reviews: { icon: '⭐', label: 'Avaliações', color: 'var(--accent)' },
  reputation: { icon: '⭐', label: 'Reputação', color: 'var(--accent)' },
  posts: { icon: '📝', label: 'Posts', color: 'var(--accent)' },
  activity: { icon: '📝', label: 'Atividade', color: 'var(--accent)' },
  services: { icon: '🏥', label: 'Serviços', color: 'var(--accent)' },
  attributes: { icon: '✅', label: 'Atributos', color: 'var(--accent)' },
  verification: { icon: '✅', label: 'Verificação', color: 'var(--accent)' },
}

export function getCategoryIcon(name: string): string {
  return CATEGORY_META[name]?.icon ?? '•'
}
