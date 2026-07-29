import { type ReactNode } from 'react'

interface BadgeProps {
  className?: string
  children: ReactNode
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] uppercase ${className}`}
      style={{ color: 'var(--accent-bright)' }}
    >
      {children}
    </span>
  )
}
