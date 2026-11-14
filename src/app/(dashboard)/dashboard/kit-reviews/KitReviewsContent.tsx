'use client'

import { useCallback } from 'react'
import { getVocab } from '@/lib/vertical-vocab'

interface Props {
  profileName: string
  reviewUrl: string
  landingUrl: string
  qrDataUrl: string
  specialty: string | null
}

export function KitReviewsContent({ profileName, reviewUrl, landingUrl, qrDataUrl, specialty }: Props) {
  const vocab = getVocab(specialty)
  const MESSAGES = vocab.whatsappMessages.map(m => ({
    label: m.label,
    text: m.text.replace(' {link}', ''),
  }))
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header (não imprime) */}
      <div className="print:hidden mb-8">
        <h1 className="font-display font-semibold text-white text-[28px] tracking-[-0.5px] mb-2">
          Kit de Avaliações
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 15, lineHeight: 1.6 }}>
          Imprima o cartão com QR Code para a recepção e use as mensagens prontas para pedir avaliações.
        </p>
        <button
          onClick={handlePrint}
          className="mt-4 px-6 py-3 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Imprimir cartão para recepção
        </button>
      </div>

      {/* ===== CARTÃO IMPRIMÍVEL (A5 landscape) ===== */}
      <div
        className="print:block print:m-0 print:p-0 print:shadow-none rounded-2xl overflow-hidden mb-10"
        style={{ background: '#fff' }}
      >
        <div
          className="p-10 flex flex-col items-center text-center"
          style={{ minHeight: 400 }}
        >
          {/* Logo area */}
          <div className="flex items-center gap-2 mb-6">
            <svg width="24" height="28" viewBox="0 0 28 32" fill="none">
              <path d="M14 0L17.5 6L28 8L20 16L22 28L14 23L6 28L8 16L0 8L10.5 6L14 0Z" fill="#14B8A6" />
            </svg>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              Destaka
            </span>
          </div>

          {/* Nome do profissional */}
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, lineHeight: 1.3 }}>
            {profileName}
          </h2>

          <p style={{ fontSize: 16, color: '#555', marginBottom: 24, lineHeight: 1.5, maxWidth: 380 }}>
            Sua opinião faz a diferença. Avalie no Google e ajude outras pessoas a encontrar um profissional de confiança.
          </p>

          {/* QR Code */}
          <div style={{ marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR Code para avaliação no Google"
              width={180}
              height={180}
              style={{ borderRadius: 12 }}
            />
          </div>

          <p style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
            Aponte a câmera do celular para o QR Code
          </p>
          <p style={{ fontSize: 11, color: '#bbb' }}>
            ou acesse: {landingUrl}
          </p>

          {/* 5 estrelas */}
          <div style={{ marginTop: 20, fontSize: 28, color: '#FBBF24', letterSpacing: 4 }}>
            ★★★★★
          </div>
        </div>
      </div>

      {/* ===== MENSAGENS PRONTAS (não imprime junto com o cartão) ===== */}
      <div className="print:hidden">
        <h2 className="font-display font-semibold text-white text-[20px] mb-1">
          Mensagens prontas
        </h2>
        <p className="text-[13px] mb-5" style={{ color: 'var(--text-tertiary)' }}>
          Copie e envie pelo WhatsApp aos seus {vocab.clientes}
        </p>

        <div className="flex flex-col gap-4">
          {MESSAGES.map((msg, i) => (
            <MessageCard key={i} label={msg.label} text={msg.text} link={reviewUrl} />
          ))}
        </div>

        {/* Meta semanal */}
        <div
          className="mt-8 rounded-2xl p-6"
          style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)' }}
        >
          <h3 className="font-display font-bold text-white text-[15px] mb-2">
            Meta semanal: 5 avaliações
          </h3>
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            Peça a 1 {vocab.cliente} por dia. Em 4 meses no ritmo de 5 por semana, você ultrapassa a maioria dos concorrentes da sua região. Cada avaliação conta.
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          nav, header, aside, .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          @page { size: A5 landscape; margin: 0; }
        }
      `}</style>
    </div>
  )
}

function MessageCard({ label, text, link }: { label: string; text: string; link: string }) {
  const fullText = `${text} ${link}`

  function handleCopy() {
    navigator.clipboard.writeText(fullText).catch(() => {
      const input = document.createElement('textarea')
      input.value = fullText
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    })
  }

  function handleWhatsApp() {
    if (navigator.share) {
      navigator.share({ text: fullText }).catch(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank')
      })
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank')
    }
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-[13px] mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {text} <span style={{ color: 'var(--accent-bright)' }}>[link]</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold"
          style={{ background: '#25D366', color: '#fff' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Enviar
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
          style={{ background: 'rgba(14,165,233,0.15)', color: 'var(--accent-bright)', border: '1px solid rgba(14,165,233,0.25)' }}
        >
          Copiar
        </button>
      </div>
    </div>
  )
}
