'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { MobileNav } from './MobileNav'

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: '📊', href: '/dashboard' },
  { label: 'Avaliações', icon: '⭐', href: '/dashboard/reviews' },
  { label: 'Posts', icon: '📝', href: '/dashboard/posts' },
  { label: 'Otimizações', icon: '⚡', href: '/dashboard/optimizations' },
  { label: 'Concorrentes', icon: '🎯', href: '/dashboard/competitors' },
  { label: 'Plano', icon: '💎', href: '/dashboard/plan' },
]

interface Props {
  children: ReactNode
  activeHref: string
  profileName: string
  userEmail: string
}

export function DashboardLayout({ children, activeHref, profileName, userEmail }: Props) {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(160deg, #14532D 0%, #0A2E18 100%)' }}
    >
      {/* Orb accent */}
      <div
        className="fixed pointer-events-none blur-[160px] rounded-full"
        style={{ width: 600, height: 600, background: 'rgba(217,119,6,0.08)', top: -200, right: -200 }}
      />

      {/* Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 fixed top-0 left-0 bottom-0 z-40 px-4 py-6"
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Logo */}
        <div className="px-2 mb-4">
          <Logo size="md" href="/dashboard" />
        </div>

        {/* Perfil */}
        <p className="px-2 mb-6 text-sm truncate font-semibold text-white">
          {profileName}
        </p>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => {
            const isActive = item.href === activeHref
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  paddingLeft: isActive ? '10px' : '12px',
                  paddingRight: '12px',
                  background: isActive ? 'var(--accent-bg)' : 'transparent',
                  color: isActive ? 'var(--accent-bright)' : 'var(--text-tertiary)',
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  borderRadius: isActive ? '0 12px 12px 0' : '12px',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                    ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'
                  }
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Email + logout */}
        <div className="px-2 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs truncate mb-2" style={{ color: 'var(--text-muted)' }}>{userEmail}</p>
          <a
            href="/api/auth/signout"
            className="text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
          >
            Sair
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-56 relative z-10">
        <MobileNav profileName={profileName} userEmail={userEmail} activeHref={activeHref} />
        {children}
      </main>
    </div>
  )
}
