import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const metadata = {
  title: 'Política de Privacidade | Destaka',
  description: 'Como a Destaka coleta, usa e protege seus dados.',
}

function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{ background: 'rgba(15,17,23,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Logo size="md" href="/" />
        <Button variant="primary" size="md" href="/saude/diagnostico">
          Diagnóstico grátis
        </Button>
      </div>
    </nav>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2
        className="font-display font-bold mb-4"
        style={{ fontSize: 20, color: 'var(--accent)' }}
      >
        {title}
      </h2>
      <div style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, fontSize: 15 }}>
        {children}
      </div>
    </div>
  )
}

export default function PrivacidadePage() {
  return (
    <main style={{ background: 'var(--bg-gradient)', minHeight: '100vh' }}>
      <Nav />

      <div className="fixed rounded-full pointer-events-none blur-[140px]" style={{ width: 500, height: 500, background: 'rgba(14,165,233,0.10)', top: -150, right: -150 }} />
      <div className="fixed rounded-full pointer-events-none blur-[100px]" style={{ width: 300, height: 300, background: 'rgba(22,163,74,0.08)', bottom: -80, left: -80 }} />

      <div className="max-w-3xl mx-auto px-6 pt-36 pb-24 relative z-10">

        <div className="mb-12">
          <Badge className="mb-6">Documento legal</Badge>
          <h1
            className="font-display font-extrabold text-white tracking-tight mb-3"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: '-1.5px' }}
          >
            Política de Privacidade
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
            Última atualização: 14 de maio de 2026
          </p>
        </div>

        <div
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Section title="1. Quem somos">
            <p>
              A Destaka (destaka.com.br) é uma plataforma de otimização de presença digital para clínicas de saúde no Google. Operamos como controladora dos dados coletados por meio de nossos serviços.
            </p>
            <p className="mt-3">
              Contato: <span style={{ color: 'var(--accent)' }}>privacidade@destaka.com.br</span>
            </p>
          </Section>

          <Section title="2. Dados que coletamos">
            <p className="mb-3">Coletamos os seguintes dados ao usar a Destaka:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Dados da conta Google:</strong> nome, email e foto de perfil, fornecidos via autenticação OAuth do Google.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Dados do Google Meu Negócio:</strong> informações do perfil da sua clínica, categorias, horários, fotos, avaliações e estatísticas de desempenho, acessados com sua autorização expressa.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Tokens de acesso:</strong> tokens OAuth criptografados com AES-256-GCM para acessar a API do Google em seu nome.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Dados de uso:</strong> interações com a plataforma, diagnósticos gerados, otimizações aplicadas e progresso no checklist.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Dados de cobrança:</strong> processados diretamente pelo Stripe. A Destaka não armazena dados de cartão de crédito.</li>
            </ul>
          </Section>

          <Section title="3. Como usamos seus dados">
            <p className="mb-3">Usamos seus dados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Gerar o diagnóstico de visibilidade do seu perfil no Google.</li>
              <li>Aplicar otimizações automáticas no seu perfil do Google Meu Negócio com sua aprovação.</li>
              <li>Sugerir e publicar posts e respostas a avaliações em seu nome.</li>
              <li>Exibir estatísticas e progresso da sua clínica dentro da plataforma.</li>
              <li>Comunicar atualizações relevantes do serviço por email.</li>
            </ul>
            <p className="mt-3">
              Não vendemos, alugamos nem compartilhamos seus dados com terceiros para fins de marketing.
            </p>
          </Section>

          <Section title="4. Base legal para o tratamento">
            <p>
              O tratamento dos seus dados é realizado com base nas seguintes hipóteses legais previstas na LGPD (Lei 13.709/2018):
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Consentimento:</strong> para acesso ao Google Meu Negócio via OAuth.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Execução de contrato:</strong> para prestar os serviços contratados.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Interesse legítimo:</strong> para melhoria contínua da plataforma e segurança.</li>
            </ul>
          </Section>

          <Section title="5. Compartilhamento com terceiros">
            <p className="mb-3">Compartilhamos dados apenas com:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Google LLC:</strong> para acessar e atualizar seu perfil no Google Meu Negócio via API oficial.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Supabase:</strong> banco de dados e autenticação, com servidores na região US-East.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Stripe:</strong> processamento de pagamentos.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Anthropic (Claude):</strong> geração de conteúdo de posts e respostas via IA, sem armazenar dados pessoais identificáveis.</li>
            </ul>
          </Section>

          <Section title="6. Segurança dos dados">
            <p>
              Adotamos as seguintes medidas de segurança:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Tokens OAuth criptografados em repouso com AES-256-GCM.</li>
              <li>Comunicação exclusivamente via HTTPS/TLS com HSTS ativado.</li>
              <li>Controle de acesso por Row Level Security no banco de dados.</li>
              <li>Acesso restrito aos dados por função de serviço com chave de serviço.</li>
            </ul>
          </Section>

          <Section title="7. Retenção dos dados">
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, excluímos seus dados em até 30 dias, exceto quando obrigados por lei a retê-los por prazo maior.
            </p>
          </Section>

          <Section title="8. Seus direitos (LGPD)">
            <p className="mb-3">Você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Confirmar a existência de tratamento dos seus dados.</li>
              <li>Acessar os dados que mantemos sobre você.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar a exclusão dos seus dados.</li>
              <li>Revogar o consentimento a qualquer momento, inclusive desconectando o acesso ao Google em Configurações da conta.</li>
              <li>Portabilidade dos seus dados em formato legível por máquina.</li>
            </ul>
            <p className="mt-3">
              Para exercer esses direitos, entre em contato pelo email: <span style={{ color: 'var(--accent)' }}>privacidade@destaka.com.br</span>
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              Usamos cookies essenciais para autenticação e manutenção da sessão. Não usamos cookies de rastreamento ou publicidade. Ao usar a Destaka, você concorda com o uso desses cookies essenciais.
            </p>
          </Section>

          <Section title="10. Alterações nesta política">
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos usuários ativos por email quando houver mudanças significativas. O uso continuado da plataforma após a notificação implica aceite das novas condições.
            </p>
          </Section>

          <Section title="11. Contato">
            <p>
              Para dúvidas, solicitações ou exercício de direitos relacionados a esta política:
            </p>
            <div
              className="mt-4 p-4 rounded-xl"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}
            >
              <p style={{ color: 'rgba(255,255,255,0.9)' }}><strong>Destaka</strong></p>
              <p>Email: <span style={{ color: 'var(--accent)' }}>privacidade@destaka.com.br</span></p>
              <p>Site: <span style={{ color: 'var(--accent)' }}>destaka.com.br</span></p>
            </div>
          </Section>
        </div>

        <div className="flex items-center justify-between mt-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/termos" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }} className="hover:text-white transition-colors">
            Termos de Uso
          </Link>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }} className="hover:text-white transition-colors">
            Voltar ao site
          </Link>
        </div>
      </div>
    </main>
  )
}
