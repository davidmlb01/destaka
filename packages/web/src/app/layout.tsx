import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import './globals.css'

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
  title: 'Destaka Saúde — Quem te procura, te encontra.',
  description: 'Presença digital no piloto automático para profissionais de saúde.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full" data-vertical="saude">
      <body className={`${outfit.variable} ${inter.variable} min-h-full antialiased`}>
        {children}
      </body>
    </html>
  )
}
