import { Logo } from '@/components/ui/Logo'

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1117 50%, #0a0a0a 100%)' }}
    >
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>
        <h1
          className="font-display font-extrabold text-white mb-3"
          style={{ fontSize: 48, letterSpacing: '-1px' }}
        >
          404
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 32 }}>
          Página não encontrada.
        </p>
        <a
          href="/dashboard"
          className="inline-block font-medium rounded-xl transition-colors"
          style={{
            background: '#16a34a',
            color: '#fff',
            padding: '12px 28px',
            fontSize: 15,
          }}
        >
          Voltar ao painel
        </a>
      </div>
    </main>
  )
}
