'use client'

interface AdminAlertBarProps {
  brokenTokensCount: number
  totalPending: number
}

function AlertTriangleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function AdminAlertBar({ brokenTokensCount, totalPending }: AdminAlertBarProps) {
  const hasAlerts = brokenTokensCount > 0 || totalPending > 0
  if (!hasAlerts) return null

  const primary = brokenTokensCount > 0

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 20px',
        background: primary ? 'var(--admin-error-bg)' : 'var(--admin-warning-bg)',
        borderBottom: `1px solid ${primary ? 'var(--admin-error-border)' : 'var(--admin-warning-border)'}`,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ color: primary ? 'var(--admin-error)' : 'var(--admin-warning)', display: 'flex', alignItems: 'center' }}>
        <AlertTriangleIcon />
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: primary ? 'var(--admin-error)' : 'var(--admin-warning)' }}>
        {primary ? 'Atenção: tokens com problema' : 'Itens pendentes de revisão'}
      </span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {brokenTokensCount > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'var(--admin-error-bg)',
              color: 'var(--admin-error)',
              border: '1px solid var(--admin-error-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <AlertTriangleIcon />
            {brokenTokensCount} token{brokenTokensCount > 1 ? 's' : ''} invalido{brokenTokensCount > 1 ? 's' : ''}
          </span>
        )}
        {totalPending > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'var(--admin-warning-bg)',
              color: 'var(--admin-warning)',
              border: '1px solid var(--admin-warning-border)',
            }}
          >
            {totalPending} pendente{totalPending > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
