import { type ReactNode } from 'react'

const variants = {
  accent: {
    base: 'text-[11px] font-bold tracking-[1.8px] uppercase',
    style: {
      background: 'rgba(245,158,11,0.15)',
      border: '1px solid rgba(245,158,11,0.3)',
      color: '#FCD34D',
    },
  },
  subtle: {
    base: 'text-[11px] font-bold tracking-[1.8px] uppercase',
    style: {
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.25)',
      color: '#FCD34D',
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
      {icon && <span style={{ color: '#F59E0B' }}>✦</span>}
      {children}
    </span>
  )
}
