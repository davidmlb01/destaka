'use client'

/**
 * Label de seção padronizado. Uppercase, tracking, muted.
 * Uso: <SectionLabel>Performance</SectionLabel>
 */
export function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`text-[11px] font-semibold tracking-[0.08em] uppercase ${className}`}
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </p>
  )
}
