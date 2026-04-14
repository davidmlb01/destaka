'use client'

import { useState } from 'react'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '📊', href: '/dashboard', active: true },
  { label: 'Avaliações', icon: '⭐', href: '/dashboard/reviews', active: false },
  { label: 'Posts', icon: '📝', href: '/dashboard/posts', active: false },
  { label: 'Otimizações', icon: '⚡', href: '/dashboard/optimizations', active: false },
  { label: 'Concorrentes', icon: '🎯', href: '/dashboard/competitors', active: false },
  { label: 'Plano', icon: '💎', href: '/dashboard/plan', active: false },
]

interface MobileNavProps {
  profileName: string
  userEmail: string
}

export function MobileNav({ profileName, userEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Top bar */}
      <div
        className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-4"
        style={{
          background: 'rgba(10,46,24,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: '#F59E0B', fontSize: 18 }}>✦</span>
          <span className="font-display font-extrabold text-white" style={{ fontSize: 16 }}>
            Desta<span style={{ color: '#F59E0B' }}>ka</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs truncate max-w-[120px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {profileName}
          </p>
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col gap-1 p-1.5"
            aria-label="Abrir menu"
          >
            <span className="block w-5 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.7)' }} />
            <span className="block w-5 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.7)' }} />
            <span className="block w-4 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.7)' }} />
          </button>
        </div>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          onClick={() => setOpen(false)}
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Drawer panel */}
      <div
        className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col px-4 py-6 transition-transform duration-300"
        style={{
          background: 'rgba(10,46,24,0.98)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-2">
            <span style={{ color: '#F59E0B', fontSize: 20 }}>✦</span>
            <span className="font-display font-extrabold text-white" style={{ fontSize: 18 }}>
              Desta<span style={{ color: '#F59E0B' }}>ka</span>
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-lg leading-none"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        {/* Perfil ativo */}
        <div
          className="rounded-xl px-3 py-3 mb-6"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <p className="text-xs font-medium text-white truncate">{profileName}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Perfil ativo</p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: item.active ? 'rgba(217,119,6,0.15)' : 'transparent',
                color: item.active ? '#FCD34D' : 'rgba(255,255,255,0.5)',
                border: item.active ? '1px solid rgba(217,119,6,0.2)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* User */}
        <div className="px-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{userEmail}</p>
        </div>
      </div>
    </>
  )
}
