import Link from 'next/link'

interface CTABoxProps {
  title?: string
  description?: string
  buttonText?: string
  href?: string
}

export function CTABox({
  title = 'Quer melhorar sua presença digital?',
  description = 'Faça um diagnóstico gratuito e descubra como seus pacientes encontram você online.',
  buttonText = 'Diagnóstico gratuito',
  href = '/saude/verificar',
}: CTABoxProps) {
  return (
    <div
      className="rounded-xl p-6 my-8"
      style={{
        background: 'linear-gradient(135deg, #0F2A1F 0%, #1a3d2e 100%)',
      }}
    >
      <h3
        className="font-display font-bold text-lg mb-2"
        style={{ color: '#ffffff' }}
      >
        {title}
      </h3>
      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {description}
      </p>
      <Link
        href={href}
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:brightness-110"
        style={{
          background: '#4ade80',
          color: '#0F2A1F',
        }}
      >
        {buttonText}
      </Link>
    </div>
  )
}
