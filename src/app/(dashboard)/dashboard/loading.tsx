export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl h-[340px]" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="rounded-2xl h-[340px]" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl h-[120px]" style={{ background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
    </div>
  )
}
