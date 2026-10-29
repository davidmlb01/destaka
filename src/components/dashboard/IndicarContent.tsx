'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { getVocab } from '@/lib/vertical-vocab'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Referral {
  id: string
  orgName: string
  status: 'pending' | 'active' | 'cancelled'
  activatedAt: string | null
  createdAt: string
}

interface ReferralData {
  code: string | null
  link: string | null
  activeCount: number
  discountPercent: number
  referrals: Referral[]
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Aguardando', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  active: { label: 'Ativo', color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
  cancelled: { label: 'Cancelado', color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
}

export function IndicarContent({ specialty }: { userId: string; specialty?: string | null }) {
  const vocab = getVocab(specialty)
  const [copied, setCopied] = useState(false)
  const { data, isLoading } = useSWR<ReferralData>('/api/referral', fetcher)

  function handleCopy() {
    if (!data?.link) return
    navigator.clipboard.writeText(data.link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleWhatsApp() {
    if (!data?.link) return
    const text = `Conheça o Destaka, que cuida do seu Google automaticamente. Use meu link e ganhe desconto: ${data.link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white/60" />
      </div>
    )
  }

  if (!data?.code) {
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Seu código de indicação será gerado automaticamente. Volte em instantes.
        </p>
      </div>
    )
  }

  const freeSlots = Math.max(0, 5 - data.activeCount)

  return (
    <div className="flex flex-col gap-6">

      {/* Progresso do desconto */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-bold text-white text-sm">Seu desconto</p>
          <p className="font-display font-extrabold" style={{ fontSize: 24, color: data.discountPercent > 0 ? '#4ADE80' : 'rgba(255,255,255,0.3)' }}>
            {data.discountPercent}%
          </p>
        </div>
        {/* Barra de progresso */}
        <div className="rounded-full h-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${data.discountPercent}%`, background: data.discountPercent >= 100 ? '#4ADE80' : 'var(--accent-bright)' }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {data.activeCount} de 5 indicados ativos
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {data.discountPercent >= 100
              ? 'Você não paga nada!'
              : `Faltam ${freeSlots} para pagar zero`}
          </p>
        </div>
      </div>

      {/* Codigo e link */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-bold text-white text-sm">Seu código</p>
          <span
            className="rounded-lg px-3 py-1 text-xs font-bold"
            style={{ background: 'rgba(14,165,233,0.15)', color: 'var(--accent-bright)', letterSpacing: '1px' }}
          >
            {data.code}
          </span>
        </div>

        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Seu link de indicação
        </p>
        <div className="flex gap-2">
          <div
            className="flex-1 rounded-xl px-4 py-2.5 text-xs truncate"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}
          >
            {data.link}
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

        {/* Botao WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="w-full mt-3 rounded-xl px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Compartilhar no WhatsApp
        </button>
      </div>

      {/* Como funciona */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="font-display font-bold text-white text-sm mb-4">Como funciona</p>
        <div className="flex flex-col gap-3">
          {[
            { n: '1', text: `Envie seu link para um colega ${vocab.profissional}.` },
            { n: '2', text: 'Ele se cadastra pelo link e assina o Destaka.' },
            { n: '3', text: 'Quando ele pagar a 2a mensalidade, você ganha 20% de desconto permanente.' },
            { n: '4', text: 'Com 5 indicados ativos, você não paga mais nada.' },
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

      {/* Lista de indicacoes */}
      {data.referrals.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="font-display font-bold text-white text-sm mb-4">Suas indicações</p>
          <div className="flex flex-col gap-2">
            {data.referrals.map(ref => {
              const st = STATUS_LABELS[ref.status] ?? STATUS_LABELS.pending
              return (
                <div
                  key={ref.id}
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{ref.orgName}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {new Date(ref.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span
                    className="text-xs font-bold rounded-lg px-2.5 py-1"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
