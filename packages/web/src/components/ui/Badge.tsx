import { type ReactNode } from 'react'

const variants = {
  accent: {
    base: 'text-[11px] font-bold tracking-[1.8px] uppercase',
    style: {
      background: 'rgba(14,165,233,0.15)',
      border: '1px solid rgba(14,165,233,0.3)',
      color: 'var(--accent-bright)',
    },
  },
  subtle: {
    base: 'text-[11px] font-bold tracking-[1.8px] uppercase',
    style: {
      background: 'rgba(14,165,233,0.12)',
      border: '1px solid rgba(14,165,233,0.25)',
      color: 'var(--accent-bright)',
    },
  },
  muted: {
    base: 'text-[12px] font-semibold tracking-[1px] uppercase',
    style: {
      color: 'rgba(255,255,255,0.4)',
    },
  },
} as const

type BadgeVariant = keyof typeof variants

interface BadgeProps {
  variant?: BadgeVariant
  icon?: boolean
  className?: string
  children: ReactNode
}

export function Badge({ variant = 'accent', icon = true, className = '', children }: BadgeProps) {
  const v = variants[variant]

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ${v.base} ${className}`}
      style={v.style}
    >
      {icon && <span style={{ color: 'var(--accent)' }}>✦</span>}
      {children}
    </span>
  )
}
