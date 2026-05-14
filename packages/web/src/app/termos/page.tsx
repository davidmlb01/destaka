import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const metadata = {
  title: 'Termos de Uso | Destaka',
  description: 'Termos e condições de uso da plataforma Destaka.',
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

export default function TermosPage() {
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
            Termos de Uso
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
          <Section title="1. Aceitação dos termos">
            <p>
              Ao criar uma conta ou usar qualquer funcionalidade da Destaka (destaka.com.br), você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize o serviço.
            </p>
            <p className="mt-3">
              Estes termos constituem um acordo legal entre você (o &quot;Usuário&quot;) e a Destaka (&quot;nós&quot;, &quot;nosso&quot;).
            </p>
          </Section>

          <Section title="2. Descrição do serviço">
            <p>
              A Destaka é uma plataforma SaaS que ajuda clínicas de saúde a melhorar sua visibilidade no Google, oferecendo:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Diagnóstico de visibilidade do perfil no Google Meu Negócio.</li>
              <li>Otimização automatizada de informações do perfil.</li>
              <li>Criação e publicação de posts e atualizações.</li>
              <li>Gerenciamento e resposta a avaliações.</li>
              <li>Checklist guiado de boas práticas para o Google Meu Negócio.</li>
            </ul>
          </Section>

          <Section title="3. Elegibilidade e conta">
            <p>
              Para usar a Destaka, você deve:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Ter pelo menos 18 anos.</li>
              <li>Ser o proprietário ou representante autorizado do estabelecimento cadastrado.</li>
              <li>Possuir uma conta Google válida com acesso ao Google Meu Negócio.</li>
              <li>Fornecer informações verdadeiras e atualizadas no cadastro.</li>
            </ul>
            <p className="mt-3">
              Você é responsável por manter a segurança das suas credenciais de acesso.
            </p>
          </Section>

          <Section title="4. Autorização de acesso ao Google Meu Negócio">
            <p>
              Ao conectar sua conta Google, você nos autoriza expressamente a:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Ler as informações do seu perfil no Google Meu Negócio.</li>
              <li>Atualizar informações do perfil (nome, horários, descrição, fotos) com sua aprovação.</li>
              <li>Publicar posts e responder a avaliações em seu nome.</li>
              <li>Acessar estatísticas de desempenho do perfil.</li>
            </ul>
            <p className="mt-3">
              Todas as ações na sua conta Google são registradas e auditáveis. Você pode revogar esse acesso a qualquer momento nas configurações da sua conta Destaka ou diretamente em myaccount.google.com.
            </p>
          </Section>

          <Section title="5. Planos e pagamento">
            <p>
              A Destaka oferece um diagnóstico gratuito e planos pagos com diferentes níveis de funcionalidade. Ao assinar um plano pago:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>A cobrança é mensal ou anual, conforme o plano escolhido.</li>
              <li>O pagamento é processado pelo Stripe com renovação automática.</li>
              <li>O cancelamento pode ser feito a qualquer momento, sem multa.</li>
              <li>Após o cancelamento, o acesso permanece ativo até o fim do período já pago.</li>
              <li>Não oferecemos reembolso pro-rata para cancelamentos antecipados, exceto nos casos previstos no Código de Defesa do Consumidor.</li>
            </ul>
          </Section>

          <Section title="6. Uso aceitável">
            <p>
              Você concorda em usar a Destaka apenas para fins legítimos e em conformidade com as leis aplicáveis. É vedado:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Usar o serviço para publicar conteúdo falso, enganoso ou que viole as políticas do Google.</li>
              <li>Tentar acessar contas de outros usuários ou sistemas internos da plataforma.</li>
              <li>Usar automação não autorizada para extrair dados da plataforma.</li>
              <li>Revender ou sublicenciar o acesso ao serviço sem autorização expressa.</li>
              <li>Publicar conteúdo que infrinja direitos de terceiros ou legislação vigente.</li>
            </ul>
          </Section>

          <Section title="7. Conteúdo gerado por IA">
            <p>
              A Destaka usa inteligência artificial (Claude, da Anthropic) para sugerir posts, respostas a avaliações e recomendações de otimização. Sobre esse conteúdo:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Sugestões de IA são revisadas pelo usuário antes da publicação no modo padrão.</li>
              <li>Você é o único responsável pelo conteúdo publicado em seu perfil do Google.</li>
              <li>A Destaka não se responsabiliza por danos decorrentes de conteúdo publicado sem revisão adequada.</li>
            </ul>
          </Section>

          <Section title="8. Propriedade intelectual">
            <p>
              Todo o conteúdo, design, código e marca da Destaka são de propriedade exclusiva da Destaka ou de seus licenciadores. É vedada a reprodução, distribuição ou criação de obras derivadas sem autorização expressa.
            </p>
            <p className="mt-3">
              Os dados e conteúdos do seu negócio permanecem de sua propriedade. Ao usar o serviço, você nos concede uma licença limitada para processar esses dados exclusivamente para prestação do serviço contratado.
            </p>
          </Section>

          <Section title="9. Disponibilidade e limitação de responsabilidade">
            <p>
              A Destaka é fornecida &quot;como está&quot;. Embora nos esforcemos para manter alta disponibilidade, não garantimos funcionamento ininterrupto. Não nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Interrupções de serviço causadas por terceiros (Google, Supabase, Stripe).</li>
              <li>Mudanças nas políticas ou API do Google que afetem as funcionalidades da plataforma.</li>
              <li>Perda de dados causada por falhas fora do nosso controle.</li>
              <li>Resultados específicos de visibilidade no Google, que dependem de fatores externos.</li>
            </ul>
            <p className="mt-3">
              Nossa responsabilidade total está limitada ao valor pago pelos últimos 3 meses de serviço.
            </p>
          </Section>

          <Section title="10. Rescisão">
            <p>
              Podemos suspender ou encerrar sua conta em caso de violação destes termos, uso fraudulento ou não pagamento, com aviso prévio sempre que possível.
            </p>
            <p className="mt-3">
              Você pode encerrar sua conta a qualquer momento nas configurações. Após o encerramento, seus dados serão excluídos conforme nossa Política de Privacidade.
            </p>
          </Section>

          <Section title="11. Legislação aplicável">
            <p>
              Estes termos são regidos pelas leis do Brasil. Qualquer disputa será resolvida no foro da comarca de São Paulo, SP, com renúncia expressa a qualquer outro foro.
            </p>
          </Section>

          <Section title="12. Contato">
            <p>
              Para dúvidas sobre estes termos:
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

        <div className="flex items-center justify-between mt-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/privacidade" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }} className="hover:text-white transition-colors">
            Política de Privacidade
          </Link>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }} className="hover:text-white transition-colors">
            Voltar ao site
          </Link>
        </div>
      </div>
    </main>
  )
}
