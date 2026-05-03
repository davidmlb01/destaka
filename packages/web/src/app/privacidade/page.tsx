import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const metadata = {
  title: 'Politica de Privacidade | Destaka',
  description: 'Como a Destaka coleta, usa e protege seus dados.',
}

function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{ background: 'rgba(20,83,45,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Logo size="md" glow href="/" />
        <Button variant="primary" size="md" href="/diagnostico">
          Diagnostico gratis
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
        style={{ fontSize: 20, color: '#F59E0B' }}
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
    <main style={{ background: 'linear-gradient(160deg, #14532D 0%, #0A2E18 100%)', minHeight: '100vh' }}>
      <Nav />

      {/* Orbs decorativos */}
      <div className="fixed rounded-full pointer-events-none blur-[140px]" style={{ width: 500, height: 500, background: 'rgba(217,119,6,0.10)', top: -150, right: -150 }} />
      <div className="fixed rounded-full pointer-events-none blur-[100px]" style={{ width: 300, height: 300, background: 'rgba(22,163,74,0.08)', bottom: -80, left: -80 }} />

      <div className="max-w-3xl mx-auto px-6 pt-36 pb-24 relative z-10">

        {/* Header */}
        <div className="mb-12">
          <Badge className="mb-6">Documento legal</Badge>
          <h1
            className="font-display font-extrabold text-white tracking-tight mb-3"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: '-1.5px' }}
          >
            Politica de Privacidade
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
            Ultima atualizacao: 7 de abril de 2026
          </p>
        </div>

        {/* Card de conteudo */}
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
              A Destaka (destaka.com.br) e uma plataforma de otimizacao de presenca digital para clinicas de saude no Google. Operamos como controladora dos dados coletados por meio de nossos servicos.
            </p>
            <p className="mt-3">
              Contato: <span style={{ color: '#F59E0B' }}>privacidade@destaka.com.br</span>
            </p>
          </Section>

          <Section title="2. Dados que coletamos">
            <p className="mb-3">Coletamos os seguintes dados ao usar a Destaka:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Dados da conta Google:</strong> nome, email e foto de perfil, fornecidos via autenticacao OAuth do Google.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Dados do Google Meu Negocio:</strong> informacoes do perfil da sua clinica, categorias, horarios, fotos, avaliacoes e estatisticas de desempenho, acessados com sua autorizacao expressa.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Tokens de acesso:</strong> tokens OAuth criptografados com AES-256-GCM para acessar a API do Google em seu nome.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Dados de uso:</strong> interacoes com a plataforma, diagnosticos gerados, otimizacoes aplicadas e progresso no checklist.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Dados de cobranca:</strong> processados diretamente pelo Stripe. A Destaka nao armazena dados de cartao de credito.</li>
            </ul>
          </Section>

          <Section title="3. Como usamos seus dados">
            <p className="mb-3">Usamos seus dados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Gerar o diagnostico de visibilidade do seu perfil no Google.</li>
              <li>Aplicar otimizacoes automaticas no seu perfil do Google Meu Negocio com sua aprovacao.</li>
              <li>Sugerir e publicar posts e respostas a avaliacoes em seu nome.</li>
              <li>Exibir estatisticas e progresso da sua clinica dentro da plataforma.</li>
              <li>Comunicar atualizacoes relevantes do servico por email.</li>
            </ul>
            <p className="mt-3">
              Nao vendemos, alugamos nem compartilhamos seus dados com terceiros para fins de marketing.
            </p>
          </Section>

          <Section title="4. Base legal para o tratamento">
            <p>
              O tratamento dos seus dados e realizado com base nas seguintes hipoteses legais previstas na LGPD (Lei 13.709/2018):
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Consentimento:</strong> para acesso ao Google Meu Negocio via OAuth.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Execucao de contrato:</strong> para prestar os servicos contratados.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Interesse legitimo:</strong> para melhoria continua da plataforma e seguranca.</li>
            </ul>
          </Section>

          <Section title="5. Compartilhamento com terceiros">
            <p className="mb-3">Compartilhamos dados apenas com:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Google LLC:</strong> para acessar e atualizar seu perfil no Google Meu Negocio via API oficial.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Supabase:</strong> banco de dados e autenticacao, com servidores na regiao US-East.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Stripe:</strong> processamento de pagamentos.</li>
              <li><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Anthropic (Claude):</strong> geracao de conteudo de posts e respostas via IA, sem armazenar dados pessoais identificaveis.</li>
            </ul>
          </Section>

          <Section title="6. Seguranca dos dados">
            <p>
              Adotamos as seguintes medidas de seguranca:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Tokens OAuth criptografados em repouso com AES-256-GCM.</li>
              <li>Comunicacao exclusivamente via HTTPS/TLS.</li>
              <li>Controle de acesso por Row Level Security no banco de dados.</li>
              <li>Acesso restrito aos dados por funcao de servico com chave de servico.</li>
            </ul>
          </Section>

          <Section title="7. Retencao dos dados">
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Apos o cancelamento, excluimos seus dados em ate 30 dias, exceto quando obrigados por lei a retê-los por prazo maior.
            </p>
          </Section>

          <Section title="8. Seus direitos (LGPD)">
            <p className="mb-3">Voce tem direito a:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Confirmar a existencia de tratamento dos seus dados.</li>
              <li>Acessar os dados que mantemos sobre voce.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar a exclusao dos seus dados.</li>
              <li>Revogar o consentimento a qualquer momento, inclusive desconectando o acesso ao Google em Configuracoes da conta.</li>
              <li>Portabilidade dos seus dados em formato legivel por maquina.</li>
            </ul>
            <p className="mt-3">
              Para exercer esses direitos, entre em contato pelo email: <span style={{ color: '#F59E0B' }}>privacidade@destaka.com.br</span>
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              Usamos cookies essenciais para autenticacao e manutencao da sessao. Nao usamos cookies de rastreamento ou publicidade. Ao usar a Destaka, voce concorda com o uso desses cookies essenciais.
            </p>
          </Section>

          <Section title="10. Alteracoes nesta politica">
            <p>
              Podemos atualizar esta politica periodicamente. Notificaremos usuarios ativos por email quando houver mudancas significativas. O uso continuado da plataforma apos a notificacao implica aceite das novas condicoes.
            </p>
          </Section>

          <Section title="11. Contato">
            <p>
              Para duvidas, solicitacoes ou exercicio de direitos relacionados a esta politica:
            </p>
            <div
              className="mt-4 p-4 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <p style={{ color: 'rgba(255,255,255,0.9)' }}><strong>Destaka</strong></p>
              <p>Email: <span style={{ color: '#F59E0B' }}>privacidade@destaka.com.br</span></p>
              <p>Site: <span style={{ color: '#F59E0B' }}>destaka.com.br</span></p>
            </div>
          </Section>
        </div>

        {/* Links de navegacao */}
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
