'use client'

export function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className ?? ''}`}
      style={{ background: 'rgba(255,255,255,0.06)', ...style }}
    />
  )
}

function SkeletonCard({ children, height }: { children?: React.ReactNode; height?: number }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', minHeight: height }}
    >
      {children}
    </div>
  )
}

export function ReviewsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} height={110}>
          <div className="flex items-start gap-4">
            <Pulse style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Pulse style={{ width: 120, height: 14 }} />
                <Pulse style={{ width: 80, height: 14 }} />
              </div>
              <Pulse style={{ width: '100%', height: 12 }} />
              <Pulse style={{ width: '70%', height: 12 }} />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  )
}

export function PostsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, i) => (
        <SkeletonCard key={i} height={100}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Pulse style={{ width: 100, height: 20 }} />
              <Pulse style={{ width: 70, height: 24, borderRadius: 20 }} />
            </div>
            <Pulse style={{ width: '100%', height: 12 }} />
            <Pulse style={{ width: '60%', height: 12 }} />
          </div>
        </SkeletonCard>
      ))}
    </div>
  )
}

export function ChecklistSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(5)].map((_, i) => (
        <SkeletonCard key={i} height={70}>
          <div className="flex items-center gap-3">
            <Pulse style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0 }} />
            <div className="flex-1 flex flex-col gap-2">
              <Pulse style={{ width: `${60 + i * 5}%`, height: 14 }} />
              <Pulse style={{ width: `${40 + i * 3}%`, height: 11 }} />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  )
}

export function CompetitorsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, i) => (
        <SkeletonCard key={i} height={130}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Pulse style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
              <div className="flex-1 flex flex-col gap-2">
                <Pulse style={{ width: 150, height: 16 }} />
                <Pulse style={{ width: 100, height: 12 }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Pulse style={{ height: 44, borderRadius: 12 }} />
              <Pulse style={{ height: 44, borderRadius: 12 }} />
              <Pulse style={{ height: 44, borderRadius: 12 }} />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
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
