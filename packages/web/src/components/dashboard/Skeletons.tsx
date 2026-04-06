'use client'

function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className ?? ''}`}
      style={{ background: 'rgba(255,255,255,0.06)', ...style }}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Score + metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex justify-center">
          <Pulse style={{ width: 180, height: 200, borderRadius: 16 }} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Pulse key={i} style={{ height: 90, borderRadius: 16 }} />)}
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <Pulse key={i} style={{ height: 80, borderRadius: 16 }} />)}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Pulse style={{ height: 160, borderRadius: 16 }} />
        <Pulse style={{ height: 160, borderRadius: 16 }} />
      </div>
    </div>
  )
}
