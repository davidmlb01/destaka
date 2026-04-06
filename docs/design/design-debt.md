# Design Debt — Destaka Dashboard

## DD-01: Legibilidade de cores no dashboard de diagnóstico

**Reportado:** 2026-04-06
**Prioridade:** Alta
**Componente:** `src/components/dashboard/ScoreCard.tsx`, `DiagnosisPanel.tsx`

### Problema
Vermelho (#dc2626) sobre fundo verde escuro (#14532D / #0A2E18) tem contraste insuficiente.
Afeta: score badge "Crítico", barras de progresso vermelhas, ícones 🔴.

### Escopo
- Revisar paleta de cores de status para garantir contraste mínimo WCAG AA (4.5:1) sobre o fundo verde
- Considerar tons mais claros/vibrantes que funcionem sobre o fundo escuro
- Alternativas: laranja claro, coral, amarelo-alaranjado para scores baixos
- Rever também a barra de progresso vermelha (pouco visível)

### Referência visual
Screenshot: Captura de Tela 2026-04-06 às 11.14.33
