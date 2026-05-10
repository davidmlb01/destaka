'use client'

import { Logo } from '@/components/ui/Logo'
import { getScoreColor } from '@/lib/utils/score-colors'
import { getCategoryIcon } from '@/lib/constants/category-meta'

interface ScoreCategory {
  name: string
  label: string
  score: number
  maxScore: number
}


function scoreColor(score: number) {
  return getScoreColor(score)
}

function getVerdict(score: number) {
  if (score < 40) return {
    html: 'Situação crítica.<br /><em>Pacientes não te encontram.</em>',
    sub: `Com nota ${score}, seu perfil está quase invisível no Google. A maioria dos pacientes que busca na sua cidade não chega até você.`,
  }
  if (score < 60) return {
    html: 'Você está perdendo pacientes<br /><em>todos os dias.</em>',
    sub: `Seu perfil está em ${score}% do potencial. Quando um paciente pesquisa na sua cidade, há uma chance real de ele ir para o concorrente.`,
  }
  if (score < 80) return {
    html: 'Bom começo.<br /><em>Mas ainda há dinheiro na mesa.</em>',
    sub: `Nota ${score} é melhor do que a maioria, mas os ${100 - score} pontos restantes representam pacientes que você ainda não captura.`,
  }
  return {
    html: 'Perfil forte.<br /><em>Vamos chegar nos 100%.</em>',
    sub: `Nota ${score} coloca você acima da média. Com os ajustes finais, você maximiza sua presença e fecha as brechas dos concorrentes.`,
  }
}

function buildIssues(categories: ScoreCategory[], place: { rating: number | null; reviewsTotal: number | null; website: string | null }) {
  const issues: Array<{ severity: 'critical' | 'warning'; title: string; description: string }> = []

  for (const cat of categories) {
    const pct = Math.round((cat.score / cat.maxScore) * 100)
    if (cat.name === 'activity' && pct < 30) {
      issues.push({ severity: 'critical', title: 'Nenhum post recente no perfil', description: 'O algoritmo do Google favorece perfis ativos. Sem posts, você perde posição para concorrentes que publicam semanalmente.' })
    }
    if (cat.name === 'photos' && pct < 50) {
      issues.push({ severity: 'critical', title: 'Poucas fotos no perfil', description: 'Perfis com fotos recebem 42% mais pedidos de rota. O Google penaliza perfis sem imagens atualizadas.' })
    }
    if (cat.name === 'reputation' && pct < 60) {
      issues.push({ severity: 'warning', title: 'Avaliações precisam de atenção', description: place.reviewsTotal ? `Você tem ${place.reviewsTotal} avaliações (nota ${place.rating ?? '?'}). Responder todas aumenta a confiança dos pacientes.` : 'Seu perfil ainda não tem avaliações suficientes para gerar confiança.' })
    }
    if (cat.name === 'services' && pct < 40) {
      issues.push({ severity: 'warning', title: 'Serviços incompletos', description: 'Cadastre todos os seus serviços para aparecer em mais buscas específicas na sua cidade.' })
    }
    if (cat.name === 'completude' && pct < 70) {
      issues.push({ severity: 'warning', title: 'Informações básicas incompletas', description: !place.website ? 'Seu perfil não tem site cadastrado. Isso reduz a credibilidade e as chances de conversão.' : 'Preencha todas as informações (telefone, horários, descrição) para maximizar a visibilidade.' })
    }
  }

  return issues.slice(0, 5)
}

interface StepScoreProps {
  clinicName: string
  city: string
  score: number
  categories: ScoreCategory[]
  place: { rating: number | null; reviewsTotal: number | null; website: string | null }
  onCapture: () => void
}

export function StepScore({ clinicName, city, score, categories, place, onCapture }: StepScoreProps) {
  const verdict = getVerdict(score)
  const issues = buildIssues(categories, place)

  return (
    <section className="min-h-screen flex flex-col" style={{ background: '#FAFAF9' }}>

      {/* Score hero */}
      <div
        className="px-6 pt-10 pb-16 text-center relative"
        style={{ background: 'var(--bg-gradient)' }}
      >
        <div className="max-w-[680px] mx-auto flex items-center justify-between mb-10">
          <Logo size="sm" vertical="Saúde" />
          <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {clinicName} · {city}
          </span>
        </div>

        <div className="max-w-[560px] mx-auto relative z-10">
          <p className="text-[11px] font-bold tracking-[3px] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Resultado do diagnóstico
          </p>

          {/* Score circle */}
          <div className="flex items-center justify-center mb-6">
            <div
              className="w-[180px] h-[180px] rounded-full flex flex-col items-center justify-center relative"
              style={{ border: '6px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{ border: '6px solid transparent', borderTopColor: 'var(--accent-hover)', borderRightColor: 'var(--accent-hover)', transform: 'rotate(-30deg)' }}
              />
              <span className="font-display font-extrabold leading-none tracking-[-4px]" style={{ fontSize: 64, color: 'var(--accent)' }}>
                {score}
              </span>
              <span className="text-[14px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>de 100</span>
            </div>
          </div>

          <h2
            className="font-display font-extrabold text-white tracking-[-0.5px] leading-[1.2] mb-3"
            style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}
            dangerouslySetInnerHTML={{
              __html: verdict.html.replace(/<em>/g, '<em style="color:#0EA5E9;font-style:normal;">'),
            }}
          />
          <p className="text-[15px] leading-relaxed max-w-[400px] mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {verdict.sub}
          </p>
        </div>
      </div>

      {/* Score body */}
      <div className="max-w-[680px] w-full mx-auto px-6 pb-20 -mt-8 relative z-10">

        {/* Breakdown */}
        <div className="bg-white rounded-[20px] p-7 mb-5" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          <h3
            className="font-display font-bold text-[16px] mb-5 flex items-center gap-2"
            style={{ color: '#1C1917' }}
          >
            📊 Nota por categoria
            <span className="flex-1 h-px" style={{ background: '#E7E5E4' }} />
          </h3>
          <div className="flex flex-col">
            {categories.map((cat, i) => {
              const pct = Math.round((cat.score / cat.maxScore) * 100)
              return (
                <div
                  key={cat.name}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: i < categories.length - 1 ? '1px solid #E7E5E4' : 'none' }}
                >
                  <span className="text-[18px] w-7 text-center flex-shrink-0">{getCategoryIcon(cat.name)}</span>
                  <span className="flex-1 text-[14px] font-medium" style={{ color: '#1C1917' }}>{cat.label}</span>
                  <div className="w-[100px] h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#E7E5E4' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: scoreColor(pct) }}
                    />
                  </div>
                  <span
                    className="font-display font-bold text-[13px] min-w-[32px] text-right"
                    style={{ color: scoreColor(pct) }}
                  >
                    {pct}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] mt-3 text-center" style={{ color: '#A8A29E' }}>
            Dados reais do Google. Conecte seu perfil para otimizar automaticamente.
          </p>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
        <div className="bg-white rounded-[20px] p-7 mb-5" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          <h3
            className="font-display font-bold text-[16px] mb-5 flex items-center gap-2"
            style={{ color: '#1C1917' }}
          >
            🔴 O que está prejudicando você
            <span className="flex-1 h-px" style={{ background: '#E7E5E4' }} />
          </h3>
          <div className="flex flex-col">
            {issues.map((issue, i) => (
              <div
                key={issue.title}
                className="flex items-start gap-3 py-3"
                style={{ borderBottom: i < issues.length - 1 ? '1px solid #E7E5E4' : 'none' }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: issue.severity === 'critical' ? '#DC2626' : 'var(--accent-hover)' }}
                />
                <div>
                  <p className="text-[14px] font-semibold mb-0.5" style={{ color: '#1C1917' }}>{issue.title}</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: '#57534E' }}>{issue.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Cost card */}
        <div
          className="rounded-[20px] p-7 mb-5"
          style={{ background: 'linear-gradient(135deg, #1C1917 0%, #0C1A0F 100%)' }}
        >
          <p className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: 'var(--accent-hover)' }}>
            O que isso custa na prática
          </p>
          <p className="font-display font-extrabold text-[20px] text-white leading-[1.3] mb-5 tracking-[-0.5px]">
            Com nota {score}, você provavelmente está perdendo entre 3 e 5 pacientes novos por mês. Só por invisibilidade no Google.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { num: '~4', lbl: 'pacientes perdidos\npor mês' },
              { num: 'R$800', lbl: 'ticket médio\npor paciente' },
              { num: 'R$3.200', lbl: 'receita invisível\ntodo mês' },
            ].map(item => (
              <div
                key={item.lbl}
                className="rounded-xl p-3.5 text-center"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="font-display font-extrabold text-[22px] tracking-[-1px]" style={{ color: 'var(--accent)' }}>{item.num}</div>
                <div className="text-[10px] mt-1 leading-tight whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA card */}
        <div
          className="rounded-[20px] overflow-hidden mb-5"
          style={{ background: 'linear-gradient(145deg, #161B26 0%, #0F1117 60%, #1C1917 100%)', boxShadow: '0 24px 64px rgba(15,17,23,0.4)' }}
        >
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0284C7, #0EA5E9, #0284C7)' }} />

          <div className="p-8 text-center relative overflow-hidden">
            <div
              className="absolute rounded-full pointer-events-none blur-[60px]"
              style={{ width: 300, height: 300, background: 'rgba(14,165,233,0.18)', top: -80, right: -80 }}
            />

            <div className="relative z-10">
              <div
                className="text-[44px] mb-4 leading-none"
                style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 16px rgba(14,165,233,0.6))' }}
              >
                ✦
              </div>

              <h3
                className="font-display font-extrabold text-white leading-[1.2] mb-3 tracking-[-0.5px]"
                style={{ fontSize: 'clamp(22px, 4vw, 28px)' }}
              >
                A Destaka corrige tudo isso.<br />
                <span style={{ color: 'var(--accent)' }}>Automaticamente.</span>
              </h3>

              <p className="text-[15px] leading-relaxed mb-8 max-w-[420px] mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Conecte seu Google Meu Negócio agora e a Destaka começa a otimizar em menos de 5 minutos: fotos, posts, respostas, serviços e tudo mais.
              </p>

              <button
                onClick={onCapture}
                className="w-full rounded-2xl py-5 font-display font-extrabold text-[17px] flex items-center justify-center gap-2 transition-all active:scale-[0.99] mb-3"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-hover) 0%, var(--accent) 100%)',
                  color: '#1C1917',
                  boxShadow: '0 8px 32px rgba(14,165,233,0.5)',
                }}
              >
                <span>✦</span> Quero mais pacientes pelo Google.
              </button>

              <button
                onClick={onCapture}
                className="w-full rounded-xl py-3.5 font-body font-semibold text-[14px] transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                Receber relatório completo por e-mail
              </button>

              <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
                {['Garantia de 30 dias', 'Cancele quando quiser', 'Resultado em 5 minutos'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <span style={{ color: '#16A34A' }}>✓</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
