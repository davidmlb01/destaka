import Link from 'next/link'

const sizes = {
  xs: { mark: 16, text: 13, gap: 3 },
  sm: { mark: 20, text: 16, gap: 4 },
  md: { mark: 28, text: 22, gap: 5 },
  lg: { mark: 36, text: 28, gap: 6 },
} as const

type LogoSize = keyof typeof sizes

interface LogoProps {
  size?: LogoSize
  iconOnly?: boolean
  href?: string
  className?: string
  vertical?: string
}

function PinMark({ w, h, fill, pupil }: { w: number; h: number; fill: string; pupil: string }) {
  return (
    <svg width={w} height={h} viewBox="0 0 72 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        d="M36 5C50.91 5 63 17.09 63 32C63 43.5 56.4 51.7 49.6 59.6C44.5 65.55 39.6 71.2 36 76C32.4 71.2 27.5 65.55 22.4 59.6C15.6 51.7 9 43.5 9 32C9 17.09 21.09 5 36 5Z M19.5 32C24 24.5 30 21 36 21C42 21 48 24.5 52.5 32C48 39.5 42 43 36 43C30 43 24 39.5 19.5 32Z"
        fill={fill}
      />
      <circle cx="36" cy="32" r="4.2" fill={pupil} />
    </svg>
  )
}

function LogoMark({ size = 'md', iconOnly = false, vertical, className = '' }: Omit<LogoProps, 'href'>) {
  const s = sizes[size]
  const markH = Math.round(s.mark * (84 / 72))

  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: s.gap }}>
      <PinMark w={s.mark} h={markH} fill="var(--accent)" pupil="var(--accent)" />
      {!iconOnly && (
        <span className="inline-flex items-baseline" style={{ gap: s.gap }}>
          <span
            className="font-display font-bold text-white"
            style={{ fontSize: s.text, letterSpacing: '-0.5px', lineHeight: 1 }}
          >
            Destaka
          </span>
          {vertical && (
            <span
              className="font-display font-light"
              style={{ fontSize: s.text, letterSpacing: '-0.5px', lineHeight: 1, opacity: 0.4 }}
            >
              {vertical}
            </span>
          )}
        </span>
      )}
    </span>
  )
}

export function Logo({ size = 'md', iconOnly = false, href, vertical, className = '' }: LogoProps) {
  if (href) {
    return (
      <Link href={href} className={`inline-flex ${className}`}>
        <LogoMark size={size} iconOnly={iconOnly} vertical={vertical} />
      </Link>
    )
  }
  return <LogoMark size={size} iconOnly={iconOnly} vertical={vertical} className={className} />
}
