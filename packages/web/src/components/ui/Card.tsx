import { type CSSProperties, type ReactNode } from 'react'

const variants = {
  subtle: {
    base: 'rounded-2xl',
    style: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    },
  },
  glass: {
    base: 'rounded-2xl',
    style: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
    },
  },
  accent: {
    base: 'rounded-2xl',
    style: {
      background: 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(14,165,233,0.05) 100%)',
      border: '1px solid rgba(14,165,233,0.3)',
    },
  },
  light: {
    base: 'rounded-2xl bg-white',
    style: {
      border: '1px solid #E7E5E4',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    },
  },
} as const

type CardVariant = keyof typeof variants

interface CardProps {
  variant?: CardVariant
  padding?: 'sm' | 'md' | 'lg'
  className?: string
  style?: CSSProperties
  children: ReactNode
}

const paddings = {
  sm: 'p-5',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ variant = 'subtle', padding = 'md', className = '', style: userStyle, children }: CardProps) {
  const v = variants[variant]

  return (
    <div className={`${v.base} ${paddings[padding]} ${className}`} style={{ ...v.style, ...userStyle }}>
      {children}
    </div>
  )
}
