import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const metadata = {
  title: 'Termos de Uso | Destaka',
  description: 'Termos e condicoes de uso da plataforma Destaka.',
}

function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{ background: 'rgba(15,17,23,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Logo size="md" href="/" />
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

export default function TermosPage() {
  return (
    <main style={{ background: 'var(--bg-gradient)', minHeight: '100vh' }}>
      <Nav />

      {/* Orbs decorativos */}
      <div className="fixed rounded-full pointer-events-none blur-[140px]" style={{ width: 500, height: 500, background: 'rgba(14,165,233,0.10)', top: -150, right: -150 }} />
      <div className="fixed rounded-full pointer-events-none blur-[100px]" style={{ width: 300, height: 300, background: 'rgba(22,163,74,0.08)', bottom: -80, left: -80 }} />

      <div className="max-w-3xl mx-auto px-6 pt-36 pb-24 relative z-10">

        {/* Header */}
        <div className="mb-12">
          <Badge className="mb-6">Documento legal</Badge>
          <h1
            className="font-display font-extrabold text-white tracking-tight mb-3"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: '-1.5px' }}
          >
            Termos de Uso
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
          <Section title="1. Aceitacao dos termos">
            <p>
              Ao criar uma conta ou usar qualquer funcionalidade da Destaka (destaka.com.br), voce concorda com estes Termos de Uso. Se nao concordar com qualquer parte destes termos, nao utilize o servico.
            </p>
            <p className="mt-3">
              Estes termos constituem um acordo legal entre voce (o "Usuario") e a Destaka ("nos", "nosso").
            </p>
          </Section>

          <Section title="2. Descricao do servico">
            <p>
              A Destaka e uma plataforma SaaS que ajuda clinicas de saude a melhorar sua visibilidade no Google, oferecendo:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Diagnostico de visibilidade do perfil no Google Meu Negocio.</li>
              <li>Otimizacao automatizada de informacoes do perfil.</li>
              <li>Criacao e publicacao de posts e atualizacoes.</li>
              <li>Gerenciamento e resposta a avaliacoes.</li>
              <li>Checklist guiado de boas praticas para o Google Meu Negocio.</li>
            </ul>
          </Section>

          <Section title="3. Elegibilidade e conta">
            <p>
              Para usar a Destaka, voce deve:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Ter pelo menos 18 anos.</li>
              <li>Ser o proprietario ou representante autorizado do estabelecimento cadastrado.</li>
              <li>Possuir uma conta Google valida com acesso ao Google Meu Negocio.</li>
              <li>Fornecer informacoes verdadeiras e atualizadas no cadastro.</li>
            </ul>
            <p className="mt-3">
              Voce e responsavel por manter a seguranca das suas credenciais de acesso.
            </p>
          </Section>

          <Section title="4. Autorizacao de acesso ao Google Meu Negocio">
            <p>
              Ao conectar sua conta Google, voce nos autoriza expressamente a:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Ler as informacoes do seu perfil no Google Meu Negocio.</li>
              <li>Atualizar informacoes do perfil (nome, horarios, descricao, fotos) com sua aprovacao.</li>
              <li>Publicar posts e responder a avaliacoes em seu nome.</li>
              <li>Acessar estatisticas de desempenho do perfil.</li>
            </ul>
            <p className="mt-3">
              Todas as acoes na sua conta Google sao registradas e auditaveis. Voce pode revogar esse acesso a qualquer momento nas configuracoes da sua conta Destaka ou diretamente em myaccount.google.com.
            </p>
          </Section>

          <Section title="5. Planos e pagamento">
            <p>
              A Destaka oferece um diagnostico gratuito e planos pagos com diferentes niveis de funcionalidade. Ao assinar um plano pago:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>A cobranca e mensal ou anual, conforme o plano escolhido.</li>
              <li>O pagamento e processado pelo Stripe com renovacao automatica.</li>
              <li>O cancelamento pode ser feito a qualquer momento, sem multa.</li>
              <li>Apos o cancelamento, o acesso permanece ativo ate o fim do periodo ja pago.</li>
              <li>Nao oferecemos reembolso pro-rata para cancelamentos antecipados, exceto nos casos previstos no Codigo de Defesa do Consumidor.</li>
            </ul>
          </Section>

          <Section title="6. Uso aceitavel">
            <p>
              Voce concorda em usar a Destaka apenas para fins legitimos e em conformidade com as leis aplicaveis. E vedado:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Usar o servico para publicar conteudo falso, enganoso ou que viole as politicas do Google.</li>
              <li>Tentar acessar contas de outros usuarios ou sistemas internos da plataforma.</li>
              <li>Usar automacao nao autorizada para extrair dados da plataforma.</li>
              <li>Revender ou sublicenciar o acesso ao servico sem autorizacao expressa.</li>
              <li>Publicar conteudo que infrinja direitos de terceiros ou legislacao vigente.</li>
            </ul>
          </Section>

          <Section title="7. Conteudo gerado por IA">
            <p>
              A Destaka usa inteligencia artificial (Claude, da Anthropic) para sugerir posts, respostas a avaliacoes e recomendacoes de otimizacao. Sobre esse conteudo:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Sugestoes de IA sao revisadas pelo usuario antes da publicacao no modo padrao.</li>
              <li>Voce e o unico responsavel pelo conteudo publicado em seu perfil do Google.</li>
              <li>A Destaka nao se responsabiliza por danos decorrentes de conteudo publicado sem revisao adequada.</li>
            </ul>
          </Section>

          <Section title="8. Propriedade intelectual">
            <p>
              Todo o conteudo, design, codigo e marca da Destaka sao de propriedade exclusiva da Destaka ou de seus licenciadores. E vedada a reproducao, distribuicao ou criacao de obras derivadas sem autorizacao expressa.
            </p>
            <p className="mt-3">
              Os dados e conteudos do seu negocio permanecem de sua propriedade. Ao usar o servico, voce nos concede uma licenca limitada para processar esses dados exclusivamente para prestacao do servico contratado.
            </p>
          </Section>

          <Section title="9. Disponibilidade e limitacao de responsabilidade">
            <p>
              A Destaka e fornecida "como esta". Embora nos esforcemos para manter alta disponibilidade, nao garantimos funcionamento ininterrupto. Nao nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Interrupcoes de servico causadas por terceiros (Google, Supabase, Stripe).</li>
              <li>Mudancas nas politicas ou API do Google que afetem as funcionalidades da plataforma.</li>
              <li>Perda de dados causada por falhas fora do nosso controle.</li>
              <li>Resultados especificos de visibilidade no Google, que dependem de fatores externos.</li>
            </ul>
            <p className="mt-3">
              Nossa responsabilidade total esta limitada ao valor pago pelos ultimos 3 meses de servico.
            </p>
          </Section>

          <Section title="10. Rescisao">
            <p>
              Podemos suspender ou encerrar sua conta em caso de violacao destes termos, uso fraudulento ou nao pagamento, com aviso previo sempre que possivel.
            </p>
            <p className="mt-3">
              Voce pode encerrar sua conta a qualquer momento nas configuracoes. Apos o encerramento, seus dados serao excluidos conforme nossa Politica de Privacidade.
            </p>
          </Section>

          <Section title="11. Legislacao aplicavel">
            <p>
              Estes termos sao regidos pelas leis do Brasil. Qualquer disputa sera resolvida no foro da comarca de Sao Paulo, SP, com renunciia expressa a qualquer outro foro.
            </p>
          </Section>

          <Section title="12. Contato">
            <p>
              Para duvidas sobre estes termos:
            </p>
            <div
              className="mt-4 p-4 rounded-xl"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}
            >
              <p style={{ color: 'rgba(255,255,255,0.9)' }}><strong>Destaka</strong></p>
              <p>Email: <span style={{ color: 'var(--accent)' }}>contato@destaka.com.br</span></p>
              <p>Site: <span style={{ color: 'var(--accent)' }}>destaka.com.br</span></p>
            </div>
          </Section>
        </div>

        {/* Links de navegacao */}
        <div className="flex items-center justify-between mt-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/privacidade" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }} className="hover:text-white transition-colors">
            Politica de Privacidade
          </Link>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }} className="hover:text-white transition-colors">
            Voltar ao site
          </Link>
        </div>
      </div>
    </main>
  )
}
