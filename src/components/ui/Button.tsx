'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'

const variants = {
  primary: {
    base: 'text-white hover:brightness-110',
    style: { background: 'var(--accent)', boxShadow: '0 4px 24px var(--accent-bg)' },
  },
  secondary: {
    base: 'border hover:brightness-110',
    style: { color: 'var(--accent)', borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' },
  },
  ghost: {
    base: 'text-white/60 border border-white/12 hover:text-white hover:border-white/20',
    style: { background: 'rgba(255,255,255,0.08)' },
  },
} as const

const sizes = {
  sm: 'px-4 py-2.5 text-[13px]',
  md: 'px-5 py-3 text-[14px]',
  lg: 'px-8 py-4 text-[16px]',
} as const

type Variant = keyof typeof variants
type Size = keyof typeof sizes

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  href?: string
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', href, loading = false, fullWidth = false, className = '', children, disabled, style: userStyle, ...props },
  ref,
) {
  const v = variants[variant]
  const classes = [
    'inline-flex items-center justify-center gap-2 font-display font-bold rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] active:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed',
    v.base,
    sizes[size],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ')

  const mergedStyle = { ...('style' in v ? v.style : {}), ...userStyle }

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} style={mergedStyle}>
        {children}
      </Link>
    )
  }

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      style={mergedStyle}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
})
