import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Destaka — Apareça para quem precisa de você',
  description: 'Google Meu Negócio no piloto automático. Para dentistas e médicos brasileiros.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${plusJakartaSans.variable} ${inter.variable} min-h-full antialiased`}>
        {children}
      </body>
    </html>
  )
}
