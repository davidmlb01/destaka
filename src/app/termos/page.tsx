import Link from 'next/link'

export const metadata = {
  title: 'Termos de Uso | Destaka',
  description: 'Termos e condições de uso da plataforma Destaka.',
  alternates: { canonical: 'https://destaka.com.br/termos' },
  openGraph: {
    title: 'Termos de Uso | Destaka',
    description: 'Termos e condições de uso da plataforma Destaka.',
    url: 'https://destaka.com.br/termos',
    siteName: 'Destaka',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Termos de Uso | Destaka',
    description: 'Termos e condições de uso da plataforma Destaka.',
  },
}

const teal = '#14B8A6'
const bg = '#071a19'
const bgCardBorder = '#1a3d3a'

export default function TermosPage() {
  return (
    <main style={{ background: bg, color: '#fff', fontFamily: 'var(--font-geist-sans)' }} className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" style={{ color: teal }} className="text-sm mb-8 inline-block hover:opacity-80">
          ← Voltar ao início
        </Link>

        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-white/40 text-sm mb-12">Última atualização: junho de 2025</p>

        <div className="space-y-10 text-white/80 leading-relaxed">

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou utilizar o Destaka, você concorda com estes Termos de Uso e com a nossa
              <Link href="/privacy" style={{ color: teal }} className="mx-1">Política de Privacidade</Link>.
              Se não concordar com qualquer parte destes termos, não utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">2. Descrição do Serviço</h2>
            <p>
              O Destaka é uma plataforma SaaS desenvolvida pela UNLMTD Co Producoes Ltda (CNPJ 33.838.440/0001-71)
              que automatiza a gestão do Google Business Profile para profissionais de saúde no Brasil,
              incluindo monitoramento de avaliações, publicação de posts e análise de visibilidade.
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">3. Cadastro e Conta</h2>
            <p>Para utilizar o Destaka, você deve:</p>
            <ul className="mt-3 space-y-2 ml-4">
              <li>Ser proprietário ou gerente autorizado do Google Business Profile que será gerenciado.</li>
              <li>Fornecer informações verdadeiras e mantê-las atualizadas.</li>
              <li>Ser maior de 18 anos ou representante legal de pessoa jurídica.</li>
              <li>Manter a confidencialidade das suas credenciais de acesso.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">4. Uso Autorizado</h2>
            <p>Você se compromete a:</p>
            <ul className="mt-3 space-y-2 ml-4">
              <li>Utilizar o Destaka apenas para gerenciar perfis sobre os quais possui autorização legal.</li>
              <li>Revisar conteúdos gerados por IA antes da publicação, quando solicitado pela plataforma.</li>
              <li>Não utilizar a plataforma para fins ilegais, fraudulentos ou que violem as Políticas do Google.</li>
              <li>Manter a autorização OAuth ativa para que o serviço funcione corretamente.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">5. Planos e Pagamento</h2>
            <ul className="space-y-2 ml-4">
              <li><strong className="text-white">Cobrança:</strong> mensal, no dia de contratação, via cartão de crédito processado pelo Stripe.</li>
              <li><strong className="text-white">Cancelamento:</strong> pode ser realizado a qualquer momento pelo painel. O acesso permanece até o fim do período pago.</li>
              <li><strong className="text-white">Reembolso:</strong> não realizamos reembolso proporcional por período não utilizado após o início da cobrança.</li>
              <li><strong className="text-white">Alteração de preços:</strong> comunicamos com 30 dias de antecedência por e-mail.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">6. Propriedade Intelectual</h2>
            <p>
              A plataforma Destaka, seu código, design e marca pertencem à UNLMTD Co Producoes Ltda.
              O conteúdo gerado pela IA e publicado no seu perfil Google pertence a você.
              Você nos concede licença para utilizar os dados do seu perfil exclusivamente para a prestação do serviço.
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">7. Limitação de Responsabilidade</h2>
            <p>O Destaka não garante:</p>
            <ul className="mt-3 space-y-2 ml-4">
              <li>Posição específica no ranking do Google Maps ou resultados de busca.</li>
              <li>Disponibilidade contínua das APIs do Google (sujeita às políticas do Google).</li>
              <li>Resultados específicos de vendas ou crescimento de negócio.</li>
            </ul>
            <p className="mt-3">
              Nossa responsabilidade está limitada ao valor pago pelo serviço no mês em que ocorreu o dano.
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">8. Rescisão</h2>
            <p>
              Podemos suspender ou encerrar sua conta imediatamente em caso de violação destes termos,
              uso fraudulento ou atividade que prejudique outros usuários ou a plataforma,
              sem prejuízo das medidas legais cabíveis.
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">9. Modificações</h2>
            <p>
              Podemos atualizar estes Termos a qualquer momento. Alterações materiais serão comunicadas
              por e-mail com 30 dias de antecedência. O uso continuado da plataforma após esse prazo
              constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">10. Legislação Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da
              Comarca de São Paulo, SP, para dirimir quaisquer controvérsias decorrentes
              deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">11. Contato</h2>
            <p>
              <strong className="text-white">UNLMTD Co Producoes Ltda</strong><br />
              CNPJ: 33.838.440/0001-71<br />
              <a href="mailto:contato@destaka.com.br" style={{ color: teal }}>contato@destaka.com.br</a>
            </p>
          </section>

        </div>

        <div style={{ borderTop: `1px solid ${bgCardBorder}` }} className="mt-16 pt-8 text-xs text-white/30">
          Destaka — by UNLMTD Co Producoes Ltda — CNPJ 33.838.440/0001-71 —
          <Link href="/privacy" style={{ color: teal }} className="ml-1">Política de Privacidade</Link>
        </div>
      </div>
    </main>
  )
}
