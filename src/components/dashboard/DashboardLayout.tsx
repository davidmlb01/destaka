'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { PinIcon } from '@/components/ui/PinIcon'
import { MobileNav } from './MobileNav'

const FREE_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', locked: false },
  { label: 'Avaliacoes', href: '/dashboard/reviews', locked: true },
  { label: 'Posts', href: '/dashboard/posts', locked: true },
  { label: 'Otimizacoes', href: '/dashboard/optimizations', locked: true },
  { label: 'Concorrentes', href: '/dashboard/competitors', locked: true },
  { label: 'Plano', href: '/dashboard/plan', locked: true },
]

const PAID_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', locked: false },
  { label: 'Avaliacoes', href: '/dashboard/reviews', locked: false },
  { label: 'Posts', href: '/dashboard/posts', locked: false },
  { label: 'Otimizacoes', href: '/dashboard/optimizations', locked: false },
  { label: 'Concorrentes', href: '/dashboard/competitors', locked: false },
  { label: 'Plano', href: '/dashboard/plan', locked: false },
  { label: 'Indicar', href: '/indicar', locked: false },
]

// Export for backward compatibility
export const NAV_ITEMS = PAID_ITEMS.map(i => ({ label: i.label, href: i.href }))

interface Props {
  children: ReactNode
  activeHref: string
  profileName: string
  userEmail: string
  isSubscriber?: boolean
}

export function DashboardLayout({ children, activeHref, profileName, userEmail, isSubscriber = true }: Props) {
  const router = useRouter()
  const items = isSubscriber ? PAID_ITEMS : FREE_ITEMS

  function handleNavClick(e: React.MouseEvent, item: { href: string; locked: boolean }) {
    if (item.locked) {
      e.preventDefault()
      router.push(`/dashboard/upgrade?feature=${encodeURIComponent(item.href.split('/').pop() || '')}`)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Orb accent */}
      <div
        className="fixed pointer-events-none blur-[160px] rounded-full"
        style={{ width: 600, height: 600, background: 'var(--accent-bg)', top: -200, right: -200 }}
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
          <Logo size="md" href="/dashboard" vertical="Saude" />
        </div>

        {/* Perfil */}
        <p className="px-2 mb-6 text-sm truncate font-semibold text-white">
          {profileName}
        </p>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {items.map(item => {
            const isActive = item.href === activeHref
            return (
              <Link
                key={item.href}
                href={item.locked ? '#' : item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={`group flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 nav-link ${isActive ? 'nav-active' : ''}`}
                style={{
                  paddingLeft: isActive ? '10px' : '12px',
                  paddingRight: '12px',
                  background: isActive ? 'var(--accent-bg)' : 'transparent',
                  color: item.locked
                    ? 'rgba(255,255,255,0.25)'
                    : isActive
                      ? 'var(--accent-bright)'
                      : 'var(--text-tertiary)',
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  borderRadius: isActive ? '0 12px 12px 0' : '12px',
                  textDecoration: 'none',
                  cursor: item.locked ? 'pointer' : undefined,
                }}
              >
                {item.locked ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  <PinIcon size={15} color={isActive ? 'var(--accent)' : 'var(--text-tertiary)'} bg="transparent" />
                )}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Email + logout */}
        <div className="px-2 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs truncate mb-2" style={{ color: 'var(--text-muted)' }}>{userEmail}</p>
          <div className="flex items-center gap-3">
            <Link
              href="/configuracoes"
              className="text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Configuracoes
            </Link>
            <span style={{ color: 'var(--border-subtle)' }}>·</span>
            <a
              href="/api/auth/signout"
              className="text-xs transition-colors hover-signout"
              style={{ color: 'var(--text-muted)' }}
            >
              Sair
            </a>
          </div>
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
