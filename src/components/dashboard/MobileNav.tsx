'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { PinIcon } from '@/components/ui/PinIcon'
import { NAV_ITEMS } from './DashboardLayout'
import { useBadges } from './hooks/useBadges'

const BADGE_MAP: Record<string, 'reviews' | 'posts' | 'optimizations'> = {
  '/dashboard/reviews': 'reviews',
  '/dashboard/posts': 'posts',
  '/dashboard/optimizations': 'optimizations',
}

function specialtyToVertical(specialty?: string | null): string | undefined {
  if (!specialty) return undefined
  const s = specialty.toLowerCase()
  const health = ['fisioterapeuta', 'quiropraxia', 'medico', 'dentista', 'psicologo', 'nutricionista']
  const pet = ['veterinario', 'petshop']
  const legal = ['advogado', 'contador']
  if (health.includes(s)) return 'Saude'
  if (pet.includes(s)) return 'Pet'
  if (legal.includes(s)) return 'Juridico'
  return undefined
}

interface MobileNavProps {
  profileName: string
  userEmail: string
  activeHref?: string
  specialty?: string | null
}

export function MobileNav({ profileName, userEmail, activeHref, specialty }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const badges = useBadges()

  function isActive(href: string) {
    return activeHref ? href === activeHref : pathname === href
  }

  return (
    <>
      {/* Top bar */}
      <div
        className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-4"
        style={{
          background: 'var(--sidebar-bg)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Logo size="sm" vertical={specialtyToVertical(specialty)} />

        <div className="flex items-center gap-3">
          <p className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-tertiary)' }}>
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
          background: 'var(--modal-bg)',
          borderRight: '1px solid var(--border-subtle)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 mb-8">
          <Logo size="sm" vertical={specialtyToVertical(specialty)} />
          <button
            onClick={() => setOpen(false)}
            className="text-lg leading-none transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        {/* Perfil ativo */}
        <div
          className="rounded-xl px-3 py-3 mb-6"
          style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-light)' }}
        >
          <p className="text-xs font-medium text-white truncate">{profileName}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Perfil ativo</p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? 'var(--accent-bg)' : 'transparent',
                  color: active ? 'var(--accent-bright)' : 'var(--text-tertiary)',
                  border: active ? '1px solid var(--border-accent-soft)' : '1px solid transparent',
                  textDecoration: 'none',
                }}
              >
                <PinIcon size={15} color={active ? 'var(--accent)' : 'var(--text-tertiary)'} bg="transparent" />
                {item.label}
                {(() => {
                  const badgeKey = BADGE_MAP[item.href]
                  const count = badgeKey ? badges[badgeKey] : 0
                  if (!count) return null
                  return (
                    <span
                      className="ml-auto flex items-center justify-center text-[10px] font-bold text-white rounded-full shrink-0"
                      style={{ minWidth: 18, height: 18, padding: '0 5px', background: '#EF4444' }}
                    >
                      {count}
                    </span>
                  )
                })()}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-2 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs truncate mb-2" style={{ color: 'var(--text-muted)' }}>{userEmail}</p>
          <a href="/api/auth/signout" className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Sair
          </a>
        </div>
      </div>
    </>
  )
}
