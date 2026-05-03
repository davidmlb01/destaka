import Link from 'next/link'

const sizes = {
  xs: { icon: 14, text: 13, gap: 'gap-1' },
  sm: { icon: 18, text: 16, gap: 'gap-1.5' },
  md: { icon: 24, text: 22, gap: 'gap-2' },
  lg: { icon: 32, text: 28, gap: 'gap-2.5' },
} as const

type LogoSize = keyof typeof sizes

interface LogoProps {
  size?: LogoSize
  glow?: boolean
  iconOnly?: boolean
  href?: string
  className?: string
}

function LogoMark({ size = 'md', glow = false, iconOnly = false, className = '' }: Omit<LogoProps, 'href'>) {
  const s = sizes[size]

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <span
        style={{
          color: 'var(--accent)',
          fontSize: s.icon,
          filter: glow ? 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' : undefined,
          lineHeight: 1,
        }}
      >
        ✦
      </span>
      {!iconOnly && (
        <span
          className="font-display font-extrabold text-white"
          style={{ fontSize: s.text, letterSpacing: '-0.3px', lineHeight: 1 }}
        >
          Desta<span style={{ color: 'var(--accent)' }}>ka</span>
        </span>
      )}
    </span>
  )
}

export function Logo({ size = 'md', glow = false, iconOnly = false, href, className = '' }: LogoProps) {
  if (href) {
    return (
      <Link href={href} className={`inline-flex ${className}`}>
        <LogoMark size={size} glow={glow} iconOnly={iconOnly} />
      </Link>
    )
  }

  return <LogoMark size={size} glow={glow} iconOnly={iconOnly} className={className} />
}
