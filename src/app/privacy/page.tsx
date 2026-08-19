import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidade | Destaka',
  description: 'Como o Destaka coleta, usa e protege seus dados pessoais em conformidade com a LGPD.',
  alternates: { canonical: 'https://destaka.com.br/privacy' },
  openGraph: {
    title: 'Política de Privacidade | Destaka',
    description: 'Como o Destaka coleta, usa e protege seus dados pessoais em conformidade com a LGPD.',
    url: 'https://destaka.com.br/privacy',
    siteName: 'Destaka',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de Privacidade | Destaka',
    description: 'Como o Destaka coleta, usa e protege seus dados pessoais em conformidade com a LGPD.',
  },
}

const teal = '#14B8A6'
const bg = '#071a19'
const bgCard = '#0d2b29'
const bgCardBorder = '#1a3d3a'

export default function PrivacyPage() {
  return (
    <main style={{ background: bg, color: '#fff', fontFamily: 'var(--font-geist-sans)' }} className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" style={{ color: teal }} className="text-sm mb-8 inline-block hover:opacity-80">
          ← Voltar ao início
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-white/40 text-sm mb-12">Última atualização: junho de 2025</p>

        <div className="space-y-10 text-white/80 leading-relaxed">

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">1. Quem somos</h2>
            <p>
              O Destaka é uma plataforma SaaS desenvolvida e operada pela <strong className="text-white">UNLMTD Co Producoes Ltda</strong>,
              inscrita no CNPJ sob o número 33.838.440/0001-71, com sede em São Paulo, SP, Brasil.
            </p>
            <p className="mt-2">
              Para questões relacionadas à privacidade, entre em contato pelo e-mail:
              <a href="mailto:privacidade@destaka.com.br" style={{ color: teal }} className="ml-1">privacidade@destaka.com.br</a>
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">2. Dados que coletamos</h2>
            <p>Ao utilizar o Destaka, coletamos os seguintes dados:</p>
            <ul className="mt-3 space-y-2 ml-4">
              <li><strong className="text-white">Dados do Google Business Profile:</strong> informações do perfil comercial, avaliações de clientes, métricas de performance e localização — acessados via OAuth 2.0 com sua autorização explícita.</li>
              <li><strong className="text-white">Dados de conta:</strong> e-mail e nome obtidos via autenticação Google (Google Sign-In).</li>
              <li><strong className="text-white">Dados de uso:</strong> interações com a plataforma para melhoria do serviço.</li>
              <li><strong className="text-white">Dados de faturamento:</strong> processados pelo Stripe. Não armazenamos dados de cartão de crédito.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">3. Como usamos os dados</h2>
            <ul className="space-y-2 ml-4">
              <li>Gerar e sugerir respostas personalizadas para avaliações do Google.</li>
              <li>Criar e publicar posts educativos no seu Google Business Profile.</li>
              <li>Calcular o Score Destaka e fornecer recomendações de otimização.</li>
              <li>Enviar relatórios de performance mensais.</li>
              <li>Prestar suporte técnico e atendimento ao cliente.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">4. Base legal (LGPD)</h2>
            <p>O tratamento de dados realizado pelo Destaka tem como base legal:</p>
            <ul className="mt-3 space-y-2 ml-4">
              <li><strong className="text-white">Art. 7º, V — Execução de contrato:</strong> o tratamento é necessário para a prestação do serviço contratado.</li>
              <li><strong className="text-white">Art. 7º, IX — Legítimo interesse:</strong> para melhoria contínua da plataforma, sempre ponderado com seus direitos.</li>
              <li><strong className="text-white">Art. 11 — Dados sensíveis de saúde:</strong> comentários de pacientes são sanitizados (CPF, nome, telefone removidos) antes de qualquer processamento por IA, mediante consentimento explícito.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">5. Compartilhamento de dados</h2>
            <p>Seus dados podem ser compartilhados com:</p>
            <ul className="mt-3 space-y-2 ml-4">
              <li><strong className="text-white">Google APIs:</strong> necessário para leitura e escrita no seu Google Business Profile, conforme autorização OAuth que você concede.</li>
              <li><strong className="text-white">Claude AI (Anthropic):</strong> para geração de conteúdo. Dados de pacientes são anonimizados antes do envio. Não usamos dados para treinar modelos.</li>
              <li><strong className="text-white">Stripe:</strong> para processamento de pagamentos.</li>
              <li><strong className="text-white">Supabase:</strong> para armazenamento seguro dos dados da plataforma.</li>
            </ul>
            <p className="mt-3">Não vendemos, alugamos ou comercializamos seus dados pessoais com terceiros.</p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">6. Retenção de dados</h2>
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa. Após o cancelamento,
              excluímos todos os dados pessoais em até <strong className="text-white">30 dias corridos</strong>,
              salvo obrigações legais que exijam retenção por prazo maior.
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">7. Seus direitos</h2>
            <p>Nos termos da LGPD (Lei 13.709/2018), você tem direito a:</p>
            <ul className="mt-3 space-y-2 ml-4">
              <li>Confirmar a existência de tratamento dos seus dados.</li>
              <li>Acessar seus dados.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar anonimização, bloqueio ou eliminação dos dados.</li>
              <li>Portabilidade dos dados a outro fornecedor.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
            </ul>
            <p className="mt-3">
              Para exercer esses direitos: <a href="mailto:privacidade@destaka.com.br" style={{ color: teal }}>privacidade@destaka.com.br</a>
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">8. Segurança</h2>
            <ul className="space-y-2 ml-4">
              <li>Comunicações criptografadas via TLS 1.2+.</li>
              <li>Dados em repouso criptografados com AES-256.</li>
              <li>Acesso restrito por função (RBAC) com autenticação multifator.</li>
              <li>Tokens OAuth armazenados de forma segura, nunca expostos ao frontend.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">9. Cookies</h2>
            <p>
              Utilizamos apenas cookies de sessão necessários para autenticação e funcionamento da plataforma.
              Não utilizamos cookies de rastreamento de terceiros nem publicidade comportamental.
            </p>
          </section>

          <section>
            <h2 style={{ color: teal }} className="text-lg font-semibold mb-3">10. Contato</h2>
            <p>
              Dúvidas sobre esta política ou sobre o tratamento dos seus dados:
            </p>
            <p className="mt-2">
              <strong className="text-white">Encarregado de Dados (DPO):</strong><br />
              UNLMTD Co Producoes Ltda<br />
              <a href="mailto:privacidade@destaka.com.br" style={{ color: teal }}>privacidade@destaka.com.br</a>
            </p>
          </section>

        </div>

        <div style={{ borderTop: `1px solid ${bgCardBorder}` }} className="mt-16 pt-8 text-xs text-white/30">
          Destaka — by UNLMTD Co Producoes Ltda — CNPJ 33.838.440/0001-71 —
          <Link href="/termos" style={{ color: teal }} className="ml-1">Termos de Uso</Link>
        </div>
      </div>
    </main>
  )
}
