import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Destaka Saúde | Cuide dos seus pacientes. A gente cuida do Google.',
  description: 'Presença digital no piloto automático para médicos, dentistas e profissionais de saúde.',
}

export default function SaudeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-vertical="saude">
      {children}
    </div>
  )
}
