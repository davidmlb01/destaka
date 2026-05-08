'use client'

import { useState } from 'react'

export function TeaserForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const nome = (form.elements.namedItem('nome') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const whatsapp = (form.elements.namedItem('whatsapp') as HTMLInputElement).value

    try {
      await fetch('/api/public/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, email, phone: whatsapp, source: 'teaser-homepage' }),
      })
    } catch {
      // falha silenciosa: mostrar sucesso de qualquer forma
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div
        className="p-5 rounded-2xl text-center"
        style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)' }}
      >
        <p className="font-bold text-[16px]" style={{ color: '#86EFAC' }}>
          Perfeito! Você está na lista.
        </p>
        <p className="text-[14px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Entraremos em contato em breve.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        name="nome"
        type="text"
        placeholder="Seu nome"
        required
        className="w-full px-4 py-3.5 rounded-xl text-[15px] font-medium outline-none"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff',
        }}
      />
      <input
        name="email"
        type="email"
        placeholder="Seu melhor email"
        required
        className="w-full px-4 py-3.5 rounded-xl text-[15px] font-medium outline-none"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff',
        }}
      />
      <input
        name="whatsapp"
        type="tel"
        placeholder="WhatsApp (opcional)"
        className="w-full px-4 py-3.5 rounded-xl text-[15px] font-medium outline-none"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff',
        }}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl font-extrabold text-[15px] transition-all"
        style={{ background: 'var(--accent-hover)', color: '#1C1917', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Enviando...' : 'Quero garantir minha vaga'}
      </button>
    </form>
  )
}
