import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página não encontrada | Destaka',
  robots: { index: false, follow: false },
}

const teal = '#14B8A6'
const bg = '#071a19'
const bgCard = '#0d2b29'
const bgCardBorder = '#1a3d3a'

export default function NotFound() {
  return (
    <main
      style={{ background: bg, color: '#fff', fontFamily: 'var(--font-geist-sans)' }}
      className="min-h-screen flex items-center justify-center px-6"
    >
      <div className="text-center max-w-md">
        <p
          style={{ color: teal, fontFamily: 'var(--font-display)', fontSize: '6rem', lineHeight: 1, fontWeight: 400 }}
          className="mb-6"
        >
          404
        </p>

        <div
          style={{ background: bgCard, border: `1px solid ${bgCardBorder}`, borderRadius: 12 }}
          className="px-8 py-6 mb-8"
        >
          <h1 className="text-xl font-semibold mb-2">Página não encontrada</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Essa URL não existe ou foi removida.
            Verifique o endereço ou volte ao início.
          </p>
        </div>

        <Link
          href="/"
          style={{ background: teal, color: '#071a19' }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
