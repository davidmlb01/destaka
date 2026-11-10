# Auditoria de Design: Score Card e Hierarquia Tipografica

**Data:** 2026-11-10
**Status:** Diagnostico (aguardando revisao da equipe de design)

---

## Estado Atual

### ScoreGauge.tsx

| Elemento | Font | Weight | Size | Color | Problema |
|----------|------|--------|------|-------|----------|
| "SCORE DESTAKA" | body | bold | 12px (xs) | rgba(255,255,255,0.5) | Uppercase + tracking pesado compete com o numero |
| Numero (57) | display | 800 | 34px | white | OK, e o hero |
| "de 100" | body | normal | 11px | rgba(255,255,255,0.3) | Quase invisivel |
| Label status ("Bom, mas tem espaco...") | display | semibold | 14px (sm) | var(--warning) amarelo | Bold amarelo grita demais |
| Descricao ("Seu perfil aparece...") | body | normal | 13px | rgba(255,255,255,0.7) | Cinza sobre fundo escuro, pouco contraste |

### Problemas Identificados

1. **3 pesos visuais competindo:** UPPERCASE tracking + bold amarelo + cinza fino. Nenhum domina
2. **"SCORE DESTAKA" em caixa alta** cria ruido visual desnecessario acima do numero
3. **Label amarelo em bold** puxa o olho ANTES do numero (que deveria ser o hero)
4. **Descricao muito fina** (0.7 opacity) fica quase ilegivel no dark mode
5. **Sem espacamento consistente** entre os elementos textuais

---

## Proposta de Hierarquia

### Nivel 1: Numero (hero absoluto)
- O numero e o unico elemento que importa no primeiro olhar
- Manter: 34px, weight 800, white, font-display

### Nivel 2: Status label
- Deve complementar o numero, nao competir
- Proposta: 13px, weight 500 (medium, nao bold), cor do status (amarelo/verde/vermelho) mas com opacity 0.85
- Remover bold, usar medium weight

### Nivel 3: Descricao
- Texto de apoio, leitura secundaria
- Proposta: 13px, weight 400, rgba(255,255,255,0.6), line-height 1.5

### Nivel 4: "SCORE DESTAKA" header
- Opcao A: Remover completamente (o gauge ja comunica que e o score)
- Opcao B: Manter como label discreto: 10px, weight 500, letter-spacing 0.08em, rgba(255,255,255,0.35)

---

## CSS Proposto (para revisao)

```css
/* Header "Score Destaka" */
.score-header {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
}

/* Status label */
.score-status {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 500;
  /* color: statusColor com opacity 0.85 */
}

/* Description */
.score-description {
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  max-width: 240px;
}
```

---

## Referencia Visual

O estilo alvo e Linear.app: minimalista, dark-first, tipografia limpa com hierarquia clara. Cada nivel tipografico deve ter uma funcao obvia. Nada grita, tudo guia.

---

## Proximos Passos

1. Revisao com equipe de branding (@brand-chief)
2. Validar paleta de cores do status (amarelo muito saturado?)
3. Aplicar mudancas apos aprovacao
4. Estender auditoria para outros cards do dashboard (MetricCard, RankingCard, etc.)
