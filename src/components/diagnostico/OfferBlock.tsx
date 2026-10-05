'use client'

interface OfferBlockProps {
  score: number
}

const BENEFITS = [
  {
    titulo: 'Otimizacao completa do perfil',
    descricao: 'Titulo, descricao, fotos, categorias, atributos, horarios. Tudo otimizado para o Google.',
    valor: 'R$800',
  },
  {
    titulo: 'Posts semanais automaticos',
    descricao: 'Conteudo relevante publicado toda semana no seu perfil, sem voce fazer nada.',
    valor: 'R$400/mes',
  },
  {
    titulo: 'Resposta de avaliacoes com IA',
    descricao: 'Respostas personalizadas em menos de 1 hora. Profissionais e no tom certo.',
    valor: 'R$300/mes',
  },
  {
    titulo: 'Monitoramento de concorrentes',
    descricao: 'Saiba exatamente o que seus concorrentes estao fazendo e como supera-los.',
    valor: 'R$200/mes',
  },
  {
    titulo: 'Relatorio mensal de performance',
    descricao: 'Numero de visualizacoes, ligacoes, rotas e evolucao do score. Tudo em um relatorio claro.',
    valor: 'R$150/mes',
  },
]

function getCtaText(score: number): string {
  if (score < 30) return 'Quero corrigir meu perfil'
  if (score <= 50) return 'Quero mais pacientes'
  if (score <= 70) return 'Quero liderar minha regiao'
  return 'Quero manter minha lideranca'
}

export default function OfferBlock({ score }: OfferBlockProps) {
  const ctaText = getCtaText(score)

  return (
    <section aria-labelledby="offer-heading">
      <div
        className="rounded-[20px] p-6 md:p-8"
        style={{
          background: 'linear-gradient(180deg, rgba(20,184,166,0.06) 0%, rgba(20,184,166,0.02) 100%)',
          border: '1px solid var(--border-accent)',
        }}
      >
        <h2
          id="offer-heading"
          className="font-display font-bold mb-6 text-center"
          style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px' }}
        >
          Tudo que o Destaka faz pelo seu perfil
        </h2>

        {/* Stack de beneficios */}
        <div className="max-w-[560px] mx-auto">
          {BENEFITS.map((benefit, i) => (
            <div
              key={i}
              className="py-4 flex items-start gap-3"
              style={{
                borderBottom: i < BENEFITS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              {/* Check icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {benefit.titulo}
                </p>
                <p className="mt-1" style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  {benefit.descricao}
                </p>
                <p className="mt-1" style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  Valor: {benefit.valor}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Ancoragem */}
        <div className="max-w-[560px] mx-auto text-center mt-8">
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Uma agencia cobra R$2.000 por mes para fazer metade disso. E ainda pede contrato de 12 meses.
          </p>

          <p
            className="font-mono font-bold mt-4 line-through"
            style={{ fontSize: 28, color: 'var(--text-muted)', lineHeight: 1 }}
          >
            R$1.850/mes
          </p>

          <p
            className="font-mono font-bold mt-3"
            style={{ fontSize: 48, color: 'var(--accent-bright)', lineHeight: 1, letterSpacing: '-1px' }}
          >
            Menos de R$7 por dia
          </p>

          {/* Copy emocional pre-CTA */}
          <p className="mt-6" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Voce investiu anos estudando. Nao deixe seu Google te fazer parecer amador.
          </p>

          <p className="mt-2" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Deixe seu Google Meu Negocio com o Destaka enquanto voce cuida dos seus pacientes.
          </p>

          <p className="mt-2" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Mais clientes. Mais visibilidade. Mais dinheiro no seu bolso. Tudo isso pela fracao do que uma agencia cobraria.
          </p>

          {/* CTA principal */}
          <a
            href="/api/stripe/checkout"
            className="inline-flex items-center justify-center w-full mt-8 font-semibold transition-transform"
            style={{
              height: 56,
              background: 'var(--accent)',
              color: '#ffffff',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '0.2px',
              boxShadow: '0 4px 20px rgba(20,184,166,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {ctaText}
          </a>

          {/* Micro-copy + garantia */}
          <p className="mt-3" style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
            Cancele quando quiser. Sem contrato, sem multa.
          </p>

          <div className="flex items-center justify-center gap-2 mt-4">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-tertiary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              Garantia de 30 dias: melhore seu score ou devolvemos seu dinheiro. Sem perguntas, sem burocracia.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
