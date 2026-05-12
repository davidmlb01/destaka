interface StatCardProps {
  value: string
  label: string
  source?: string
}

export function StatCard({ value, label, source }: StatCardProps) {
  return (
    <div
      className="rounded-lg p-5 my-6 text-center"
      style={{
        background: '#F0FAF0',
        border: '1px solid rgba(74, 222, 128, 0.2)',
      }}
    >
      <p
        className="font-display font-bold text-3xl mb-1"
        style={{ color: '#0F2A1F' }}
      >
        {value}
      </p>
      <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
        {label}
      </p>
      {source && (
        <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
          Fonte: {source}
        </p>
      )}
    </div>
  )
}
