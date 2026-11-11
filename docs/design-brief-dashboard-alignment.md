# Design Brief: Alinhamento e Harmonia do Dashboard

**Data:** 2026-11-10
**Prioridade:** Alta
**Para:** Time de Design (UMA / @ux-design-expert)
**Status:** Aguardando revisão

---

## Contexto

O dashboard está funcional, mas precisa de polimento visual. Os ajustes técnicos foram feitos (tokens CSS, font weights, cores), mas o layout e a harmonia entre componentes precisam de olho de designer.

## Itens para revisão

### 1. Score Card vs Mapa Card (hero section)

**Problema:** Os dois cards lado a lado não estão harmoniosos.
- "SCORE DESTAKA" e "ONDE VOCÊ APARECE" precisam estar na mesma altura vertical
- O score card tem mais espaço vazio que o mapa
- O gauge poderia ser um pouco maior para preencher melhor
- Grid atual: score 2/5, mapa 3/5. Avaliar se 1/2 e 1/2 funciona melhor
- O conteúdo do score card (gauge + label + badge + sync) precisa de distribuição vertical equilibrada

**Referência:** Linear.app dashboard cards com mesma proporção visual

### 2. Ranking Card

**Problema:** O "6º" (posição) precisa de formatação que não confunda com "60"
- Já adicionamos superscript mas precisa validação visual
- O gráfico de evolução (5→6) em cor accent está ok?
- "↓ 1 desceu" em amarelo é adequado ou deveria ser mais discreto?

### 3. Detalhes do Score (6 cards de categoria)

**Problema:** Muitas cores diferentes (verde, amarelo, vermelho) criam visual carregado
- Avaliar se as barras de progresso precisam de cor ou se uma cor neutra (accent) funciona melhor
- Os cards poderiam ter design mais limpo (menos bordas, menos saturação)

### 4. Tipografia geral

**O que já foi feito:**
- font-bold → font-semibold em card headers
- ~190 inline rgba → 4 tokens CSS
- SectionLabel component unificado

**O que falta (time de design avaliar):**
- Landing pages: font-semibold (revertido, precisa re-aplicar com cuidado)
- 39 inline rgba restantes (backgrounds/SVG)
- Verificar se a escala tipográfica recomendada no audit faz sentido (docs/design-audit-full-site.md)

### 5. Gap Analysis Card

- "O que falta para o 1º lugar" com ícone vermelho dá impressão de desastre
- Avaliar tom: informativo vs alarmista
- Summary agora é: "O Destaka cuida de posts, respostas e otimizações. Sua parte: solicitar avaliações."

---

## Arquivos de referência

- `docs/design-audit-full-site.md` (358 linhas, auditoria completa)
- `docs/design-audit-score.md` (score card específico)
- `docs/design-brief-score-card.md` (brief anterior do score)
- `src/components/dashboard/ScoreGauge.tsx`
- `src/components/dashboard/MapCard.tsx`
- `src/components/dashboard/DashboardContent.tsx` (grid 5 colunas)

## Decisão necessária

O time de design precisa definir:
1. Proporção exata dos cards hero (score vs mapa)
2. Se o gauge deve ser maior (200px? 220px?)
3. Paleta de cores para os score detail cards
4. Se o ranking precisa de redesign mais profundo
