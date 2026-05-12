import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* Header */}
      <header style={{ background: '#0F2A1F' }}>
        <div className="mx-auto flex items-center justify-between px-5 py-3" style={{ maxWidth: 1080 }}>
          <div className="flex items-center gap-4">
            <Logo size="sm" href="/" />
            <Link
              href="/blog"
              className="font-display font-semibold text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Blog
            </Link>
          </div>
          <Link
            href="/saude/verificar"
            className="inline-flex items-center px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:brightness-110"
            style={{ background: '#4ade80', color: '#0F2A1F' }}
          >
            Diagnóstico gratuito
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer style={{ background: '#0F2A1F' }}>
        <div
          className="mx-auto px-5 py-12"
          style={{ maxWidth: 1080 }}
        >
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <Logo size="sm" />
              <p
                className="font-body text-sm mt-3 max-w-xs"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Presença digital no piloto automático para profissionais de saúde.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <p
                  className="font-display font-semibold text-xs uppercase tracking-wider mb-3"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Blog
                </p>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/blog"
                      className="font-body text-sm transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      Todos os artigos
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog/feed.xml"
                      className="font-body text-sm transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      RSS Feed
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p
                  className="font-display font-semibold text-xs uppercase tracking-wider mb-3"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Destaka
                </p>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/saude/verificar"
                      className="font-body text-sm transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      Diagnóstico gratuito
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacidade"
                      className="font-body text-sm transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      Privacidade
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/termos"
                      className="font-body text-sm transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      Termos
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div
            className="mt-8 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p
              className="font-body text-xs"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              © {new Date().getFullYear()} Destaka. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
