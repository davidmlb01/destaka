'use client'

import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'

interface AdminSidebarProps {
  brokenTokensCount: number
  totalPending: number
}

function LayoutDashboardIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function UsersIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function UserPlusIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  )
}

function BarChart2Icon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function AlertTriangleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

const NAV_ITEMS = [
  { id: 'overview',  label: 'Visão Geral', Icon: LayoutDashboardIcon, href: '#overview'  },
  { id: 'clients',   label: 'Clientes',    Icon: UsersIcon,            href: '#clients'   },
  { id: 'leads',     label: 'Leads',       Icon: UserPlusIcon,         href: '#leads'     },
  { id: 'traffic',   label: 'Tráfego',     Icon: BarChart2Icon,        href: '#traffic'   },
  { id: 'alerts',    label: 'Alertas',     Icon: AlertTriangleIcon,    href: '#alerts'    },
]

export function AdminSidebar({ brokenTokensCount, totalPending }: AdminSidebarProps) {
  const [activeId, setActiveId] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)
  const alertCount = brokenTokensCount + totalPending

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        background: 'var(--admin-bg-sidebar)',
        borderRight: '1px solid var(--admin-border-subtle)',
        borderRadius: '0 20px 20px 0',
        boxShadow: 'var(--admin-shadow-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 10,
      }}
      aria-label="Menu de navegação admin"
    >
      {/* Logo area */}
      <div
        style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid var(--admin-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Logo size="sm" />
        {!collapsed && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--admin-text-muted)',
              textTransform: 'uppercase',
            }}
          >
            ADMIN
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 0' }} aria-label="Secoes do admin">
        {!collapsed && (
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 22px 4px' }}>
            Navegação
          </p>
        )}
        {NAV_ITEMS.map(({ id, label, Icon, href }) => {
          const isActive = activeId === id
          const isAlerts = id === 'alerts'
          const showBadge = isAlerts && alertCount > 0

          return (
            <div key={id}>
              {id === 'alerts' && (
                <div style={{ height: 1, background: 'var(--admin-border-subtle)', margin: collapsed ? '8px 0' : '8px 10px' }} />
              )}
              <a
                href={href}
                onClick={() => setActiveId(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  margin: collapsed ? '1px 0' : '1px 10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? '#FFFFFF' : 'var(--admin-text-secondary)',
                  background: isActive ? 'rgba(20,184,166,0.18)' : 'transparent',
                  borderRadius: 12,
                  border: isActive ? '1px solid rgba(20,184,166,0.3)' : '1px solid transparent',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  minHeight: 44,
                  position: 'relative',
                  outline: 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(142,182,155,0.1)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--admin-text-primary)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--admin-text-secondary)'
                  }
                }}
                onFocus={e => {
                  (e.currentTarget as HTMLElement).style.outline = '2px solid var(--admin-accent)'
                  ;(e.currentTarget as HTMLElement).style.outlineOffset = '-2px'
                }}
                onBlur={e => {
                  (e.currentTarget as HTMLElement).style.outline = 'none'
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <Icon size={18} />
                </span>
                {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
                {showBadge && !collapsed && (
                  <span
                    style={{
                      background: 'var(--admin-error)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: '1px 6px',
                      minWidth: 18,
                      textAlign: 'center',
                    }}
                    aria-label={`${alertCount} alertas`}
                  >
                    {alertCount}
                  </span>
                )}
                {showBadge && collapsed && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--admin-error)',
                    }}
                    aria-label={`${alertCount} alertas`}
                  />
                )}
              </a>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: collapsed ? '16px 0' : '16px 20px',
          borderTop: '1px solid var(--admin-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
        }}
      >
        {!collapsed && (
          <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
            v1.0 · Destaka Admin
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--admin-text-muted)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            minWidth: 28,
            minHeight: 28,
            justifyContent: 'center',
          }}
          aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
