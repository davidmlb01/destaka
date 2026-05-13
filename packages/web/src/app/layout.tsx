import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { assertEnvVars } from '@/lib/env-check'

// LOW-02: valida env vars obrigatórias no startup — lança erro em produção se faltarem
assertEnvVars()

const outfit = Outfit({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Destaka — Quem te procura, te encontra.',
  description: 'Presença digital no piloto automático para profissionais liberais.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${outfit.variable} ${inter.variable} min-h-full antialiased`}>
        {children}
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
