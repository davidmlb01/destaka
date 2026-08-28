'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createBrowserClient } from '@supabase/ssr'

interface Props {
  plan: string
  tokenInvalid: boolean
  userEmail: string
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="font-display font-bold text-white text-sm mb-4">{title}</p>
      {children}
    </div>
  )
}

export function ConfiguracoesContent({ plan, tokenInvalid, userEmail }: Props) {
  const [reconnecting, setReconnecting] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleReconnectGoogle() {
    setReconnecting(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/configuracoes`,
        scopes: 'email profile https://www.googleapis.com/auth/business.manage',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      setReconnecting(false)
      toast.error('Erro ao reconectar: ' + error.message)
    }
  }

  async function handleDeleteAccount() {
    setDeleteStep('deleting')
    setDeleteError(null)
    try {
      const res = await fetch('/api/users/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETAR_MINHA_CONTA' }),
      })
      if (res.ok) {
        window.location.href = '/'
      } else {
        const data = await res.json()
        setDeleteError(data.error ?? 'Erro ao excluir conta.')
        setDeleteStep('confirm')
      }
    } catch {
      setDeleteError('Erro de conexão. Tente novamente.')
      setDeleteStep('confirm')
    }
  }

  return (
    <div>
      {/* Conta */}
      <Section title="Conta">
        <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{userEmail}</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Plano: <span style={{ color: plan === 'free' ? 'rgba(255,255,255,0.45)' : '#4ADE80', fontWeight: 600 }}>
            {plan === 'free' ? 'Gratuito' : 'Pro'}
          </span>
        </p>
      </Section>

      {/* Conexão Google */}
      <Section title="Conexão Google">
        {tokenInvalid && (
          <div
            className="rounded-xl px-4 py-3 mb-4 text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}
          >
            A conexão com o Google expirou. As automações estão pausadas até você reconectar.
          </div>
        )}
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          O Destaka usa a sua conta Google para acessar o Google Meu Negócio. Se as automações pararam de funcionar, reconecte aqui.
        </p>
        <button
          onClick={handleReconnectGoogle}
          disabled={reconnecting}
          className="rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-50"
          style={{
            background: 'rgba(14,165,233,0.15)',
            border: '1px solid rgba(14,165,233,0.3)',
            color: 'var(--accent-bright)',
          }}
        >
          {reconnecting ? 'Redirecionando...' : 'Reconectar conta Google'}
        </button>
      </Section>

      {/* LGPD */}
      <Section title="Seus dados (LGPD)">
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Você tem o direito de exportar todos os seus dados (Art. 15) ou solicitar a exclusão da sua conta e dados (Art. 18).
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/api/users/export-data"
            download
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Exportar meus dados (JSON)
          </a>

          {deleteStep === 'idle' && (
            <button
              onClick={() => setDeleteStep('confirm')}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all text-left"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'rgba(239,68,68,0.7)',
              }}
            >
              Excluir minha conta
            </button>
          )}

          {deleteStep === 'confirm' && (
            <div
              className="rounded-xl px-4 py-4"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <p className="text-sm font-bold text-white mb-1">Tem certeza?</p>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                Todos os seus dados serão permanentemente excluídos: perfil, avaliações, posts e histórico. Essa ação não pode ser desfeita.
              </p>
              {deleteError && (
                <p className="text-xs mb-3" style={{ color: '#FCA5A5' }}>{deleteError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setDeleteStep('idle'); setDeleteError(null) }}
                  className="flex-1 rounded-xl py-2 text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 rounded-xl py-2 text-xs font-bold"
                  style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5' }}
                >
                  Sim, excluir tudo
                </button>
              </div>
            </div>
          )}

          {deleteStep === 'deleting' && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Excluindo conta...</p>
          )}
        </div>
      </Section>
    </div>
  )
}
