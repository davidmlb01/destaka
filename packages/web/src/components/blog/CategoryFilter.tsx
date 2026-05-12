'use client'

interface CategoryFilterProps {
  categories: string[]
  active: string | null
  onChange: (category: string | null) => void
}

export function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onChange(null)}
        className="flex-shrink-0 font-body font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
        style={{
          background: active === null ? '#0F2A1F' : 'rgba(0,0,0,0.04)',
          color: active === null ? '#ffffff' : '#6B7280',
        }}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(active === cat ? null : cat)}
          className="flex-shrink-0 font-body font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: active === cat ? '#0F2A1F' : 'rgba(0,0,0,0.04)',
            color: active === cat ? '#ffffff' : '#6B7280',
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
