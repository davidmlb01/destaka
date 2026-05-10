'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'

const variants = {
  primary: {
    base: 'text-white hover:brightness-110',
    style: { background: 'var(--accent)', boxShadow: '0 4px 24px var(--accent-bg)' },
  },
  green: {
    base: 'text-white shadow-[0_4px_24px_rgba(15,17,23,0.4)] hover:shadow-[0_6px_32px_rgba(15,17,23,0.55)]',
    style: { background: 'linear-gradient(135deg, #161B26 0%, #1E2433 100%)' },
  },
  secondary: {
    base: 'border hover:brightness-110',
    style: { color: 'var(--accent)', borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' },
  },
  ghost: {
    base: 'text-white/60 border border-white/12 hover:text-white hover:border-white/20',
    style: { background: 'rgba(255,255,255,0.08)' },
  },
  white: {
    base: 'bg-white text-stone-900 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.35)]',
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
    'inline-flex items-center justify-center gap-2 font-display font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed',
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
