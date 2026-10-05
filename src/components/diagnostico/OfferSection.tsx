'use client'

interface OfferSectionProps {
  score: number
}

const beneficios = [
  { titulo: 'Otimização completa do perfil', desc: 'Título, descrição, fotos, categorias, atributos e horários.', valor: 'R$800' },
  { titulo: 'Posts semanais automáticos', desc: 'Conteúdo escrito do jeito que o Google e as IAs preferem.', valor: 'R$400/mês' },
  { titulo: 'Resposta de avaliações com IA', desc: 'Respostas personalizadas em menos de 1 hora.', valor: 'R$300/mês' },
  { titulo: 'Monitoramento de concorrentes', desc: 'Saiba o que seus concorrentes estão fazendo.', valor: 'R$200/mês' },
  { titulo: 'Relatório mensal', desc: 'Visualizações, ligações, rotas e evolução do score.', valor: 'R$150/mês' },
]

function getCtaText(score: number): string {
  if (score < 30) return 'Quero corrigir meu perfil'
  if (score < 50) return 'Quero mais clientes'
  if (score <= 70) return 'Quero liderar minha região'
  return 'Quero manter minha liderança'
}

export default function OfferSection({ score }: OfferSectionProps) {
  return (
    <section
      style={{
        padding: '32px 24px',
        borderRadius: 20,
        background: 'linear-gradient(180deg, rgba(20,184,166,0.06) 0%, rgba(20,184,166,0.02) 100%)',
        border: '1px solid var(--accent-border)',
      }}
    >
      <h2
        className="font-display font-bold text-center"
        style={{ fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 8 }}
      >
        Tudo que o Destaka faz por você
      </h2>
      <p className="text-center" style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28 }}>
        Deixe seu Google Meu Negócio com o Destaka enquanto você cuida dos seus clientes.
      </p>

      {/* Stack de benefícios */}
      <div className="flex flex-col" style={{ gap: 1, marginBottom: 28 }}>
        {beneficios.map((b, i) => (
          <div
            key={i}
            className="flex items-start gap-3"
            style={{
              padding: '14px 0',
              borderBottom: i < beneficios.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <span style={{ color: 'var(--success)', fontSize: 16, marginTop: 1, flexShrink: 0 }}>✓</span>
            <div className="flex-1">
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{b.titulo}</p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>{b.desc}</p>
            </div>
            <span
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                textDecoration: 'line-through',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {b.valor}
            </span>
          </div>
        ))}
      </div>

      {/* Ancoragem */}
      <div className="text-center" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
          Uma agência cobra R$2.000/mês para fazer metade disso.
        </p>
        <p className="font-mono font-bold" style={{ fontSize: 36, color: 'var(--accent-bright)', lineHeight: 1 }}>
          Menos de R$7/dia
        </p>
      </div>

      {/* Copy emocional */}
      <p className="text-center" style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
        Você investiu anos estudando. Não deixe seu Google te fazer parecer amador.
      </p>

      {/* CTA */}
      <a
        href="/api/stripe/checkout"
        className="block text-center font-semibold"
        style={{
          padding: '16px 32px',
          borderRadius: 14,
          background: 'var(--accent)',
          color: '#fff',
          fontSize: 16,
          textDecoration: 'none',
          transition: 'transform 150ms, box-shadow 150ms',
          boxShadow: '0 4px 24px rgba(20,184,166,0.3)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(20,184,166,0.4)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(20,184,166,0.3)' }}
      >
        {getCtaText(score)}
      </a>

      <p className="text-center" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
        Cancele quando quiser. Sem contrato, sem multa.
      </p>

      <p className="text-center" style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
        🛡 Garantia de 30 dias: melhore seu score ou devolvemos seu dinheiro.
      </p>
    </section>
  )
}
