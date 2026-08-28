import { PinIcon } from '@/components/ui/PinIcon'

export function InfoRow({ label, value, missing }: {
  label: string
  value: string
  missing: boolean
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: missing ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${missing ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <p className="text-xs mb-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
        <PinIcon size={10} color={missing ? 'var(--error)' : 'var(--accent)'} />
        {label}
      </p>
      <p
        className="text-sm font-medium"
        style={{ color: missing ? 'var(--error)' : 'rgba(255,255,255,0.8)' }}
      >
        {value}
      </p>
    </div>
  )
}
