interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-8 h-8',
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-t-transparent animate-spin ${SIZES[size]} ${className}`}
      style={{ borderColor: 'rgba(14,165,233,0.3)', borderTopColor: 'var(--accent)' }}
      aria-label="Carregando"
    />
  )
}
