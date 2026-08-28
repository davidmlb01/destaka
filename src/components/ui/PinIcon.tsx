/**
 * Pin+Olho: marca principal da Destaka.
 * Usar como favicon, icone de categoria e decorativo.
 */
export function PinIcon({
  size = 24,
  color = 'var(--accent)',
  bg = 'var(--bg-base)',
}: {
  size?: number
  color?: string
  bg?: string
}) {
  const h = Math.round(size * (160 / 120))
  return (
    <svg width={size} height={h} viewBox="0 0 120 160" fill="none" className="flex-shrink-0">
      <path d="M60 6C32.4 6 10 28.4 10 56C10 76 20 90 32 102C42 112 52 122 60 132C68 122 78 112 88 102C100 90 110 76 110 56C110 28.4 87.6 6 60 6Z" fill={color}/>
      <path d="M26 56C36 43 47 38 60 38C73 38 84 43 94 56C84 69 73 74 60 74C47 74 36 69 26 56Z" fill={bg}/>
      <circle cx="60" cy="56" r="7" fill={color}/>
    </svg>
  )
}
