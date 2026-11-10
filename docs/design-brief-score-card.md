# Design Brief: Score Card Layout

**Data:** 2026-11-10
**Prioridade:** Alta
**Componente:** src/components/dashboard/ScoreGauge.tsx + DashboardContent.tsx
**Referencia:** Linear.app dark mode

---

## Problema

O score card está mal diagramado. Todo o conteúdo ficou empurrado para cima, deixando muito espaço vazio embaixo (antes do Sync + Sincronizar). O arco do gauge é pequeno demais para o box. Não há equilíbrio visual.

## Elementos do Score Card (de cima para baixo)

1. "SCORE DESTAKA" (label uppercase)
2. Gauge arc com número "61 de 100"
3. "Espaço para crescer" (label de status, amarelo)
4. "Seu perfil aparece, mas concorrentes estão à frente." (descrição)
5. Badge "+14 pontos desde o início" (novo, verde)
6. [espaço vazio grande]
7. "Sync: 26 de out., 06:00" + botão "Sincronizar"

## O que precisa mudar

1. **Gauge arc maior:** ocupar mais espaço horizontal e vertical. Atualmente size=180, talvez 200-220
2. **Distribuição vertical equilibrada:** conteúdo centralizado no box, não empurrado para cima
3. **Score card e Map card com mesma altura:** ambos devem ter a mesma proporção visual
4. **Sync + botão na base:** ancorado no bottom do card (já está, mas o gap é muito grande)
5. **Badge "+14 pontos":** posicionar logo abaixo do gauge, antes do label de status

## Proporcao do Grid

Atualmente: Score 2/5, Mapa 3/5. Avaliar se 1/2 e 1/2 funciona melhor, ou manter 2/5 mas com gauge maior.

## Referencia Visual

O Map card está equilibrado: label no topo, mapa ocupa o espaço, info condensada embaixo. O Score card precisa do mesmo equilíbrio: label no topo, gauge no centro ocupando espaço, info embaixo, sync ancorado na base.

---

## Comparativo lado a lado (problema atual)

```
Score Card (2/5)          Map Card (3/5)
┌─────────────────┐      ┌──────────────────────────┐
│ SCORE DESTAKA    │      │ ONDE VOCE APARECE        │
│                  │      │ Seu alcance no Google Maps│
│   ╭──────╮       │      │ ┌──────────────────────┐ │
│   │  61  │       │      │ │                      │ │
│   │de 100│       │      │ │      MAPA            │ │
│   ╰──────╯       │      │ │                      │ │
│ Espaço p/ crescer│      │ │                      │ │
│ Seu perfil...    │      │ └──────────────────────┘ │
│                  │      │ ● Forte ● Medio ● Fraco  │
│                  │      │ Aparece em 6 bairros...   │
│  [MUITO VAZIO]   │      │                          │
│                  │      │                          │
│ Sync... [Sincr.] │      │                          │
└─────────────────┘      └──────────────────────────┘
```

## Proposta

```
Score Card (2/5)          Map Card (3/5)
┌─────────────────┐      ┌──────────────────────────┐
│ SCORE DESTAKA    │      │ ONDE VOCE APARECE        │
│                  │      │ Seu alcance no Google Maps│
│   ╭────────╮     │      │ ┌──────────────────────┐ │
│   │        │     │      │ │                      │ │
│   │   61   │     │      │ │      MAPA            │ │
│   │ de 100 │     │      │ │                      │ │
│   ╰────────╯     │      │ │                      │ │
│ +14 pts [badge]  │      │ └──────────────────────┘ │
│ Espaço p/ crescer│      │ ● Forte ● Medio ● Fraco  │
│ Seu perfil...    │      │ Aparece em 6 bairros...   │
│                  │      │                          │
│ Sync... [Sincr.] │      │                          │
└─────────────────┘      └──────────────────────────┘
```

Gauge maior, badge logo abaixo, conteúdo melhor distribuído.
