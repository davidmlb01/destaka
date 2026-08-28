'use client'

import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

export function IndicarContent({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false)
  const { data } = useSWR<{ count: number }>('/api/referral/count', fetcher)

  const referralLink = `${APP_URL}/login?ref=${userId}`

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Contador */}
      <div
        className="rounded-2xl p-6 flex items-center gap-6"
        style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}
      >
        <div className="text-center">
          <p className="font-display font-extrabold text-white" style={{ fontSize: 36 }}>
            {data?.count ?? 0}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            indicações confirmadas
          </p>
        </div>
        <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.08)' }} />
        <div>
          <p className="text-sm font-bold text-white">
            {(data?.count ?? 0) === 0
              ? 'Nenhuma indicação ainda'
              : `${data!.count} ${data!.count === 1 ? 'profissional indicado' : 'profissionais indicados'}`}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            {(data?.count ?? 0) > 0
              ? 'Nossa equipe entrará em contato para aplicar seus meses grátis.'
              : 'Compartilhe o link abaixo com colegas.'}
          </p>
        </div>
      </div>

      {/* Link de indicação */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="font-display font-bold text-white text-sm mb-3">Seu link de indicação</p>
        <div className="flex gap-2">
          <div
            className="flex-1 rounded-xl px-4 py-2.5 text-xs truncate"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}
          >
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all"
            style={{
              background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(14,165,233,0.15)',
              border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(14,165,233,0.3)'}`,
              color: copied ? '#4ADE80' : 'var(--accent-bright)',
            }}
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Como funciona */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="font-display font-bold text-white text-sm mb-4">Como funciona</p>
        <div className="flex flex-col gap-3">
          {[
            { n: '1', text: 'Envie seu link para um colega profissional de saúde.' },
            { n: '2', text: 'Ele se cadastra pelo link e assina o plano Pro.' },
            { n: '3', text: 'Nossa equipe credita 1 mês grátis na sua assinatura.' },
          ].map(step => (
            <div key={step.n} className="flex items-start gap-3">
              <span
                className="shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ width: 22, height: 22, background: 'rgba(14,165,233,0.15)', color: 'var(--accent-bright)', fontSize: 11 }}
              >
                {step.n}
              </span>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
