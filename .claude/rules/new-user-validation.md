# Validacao de Novo Usuario - Destaka

## Regra Central

**Todo novo usuario que assina o Destaka DEVE ter resultados visiveis no dashboard em menos de 5 minutos.** Se qualquer item abaixo falhar, o sistema esta quebrado.

## Fluxo Obrigatorio pos-Assinatura

```
Stripe checkout.session.completed
  |
  v
destaka/subscription.activated (evento Inngest)
  |
  v
onboarding-data-bootstrap.ts (fan-out IMEDIATO):
  1. destaka/gbp.audit.requested       -> popula gbp_profiles + reviews
  2. destaka/competitors.discover.requested -> popula competitive_analyses
  3. destaka/reviews.sync.requested     -> sincroniza reviews do GBP
  4. destaka/geo.collect.requested      -> popula geo_snapshots (mapa)
  5. destaka/performance.collect.requested -> popula performance_metrics
  6. destaka/keywords.snapshot.requested -> popula keyword_snapshots
  |
  v
gbp-audit cascata automatica:
  7. destaka/gbp.optimize.requested     -> gera optimization_report
  8. destaka/score.calculate.requested  -> calcula score com dados reais
```

## Validacoes Obrigatorias

### gbp_location_id
- DEVE comecar com "accounts/" ou "locations/"
- Se for Place ID (ChIJ...), o audit DEVE corrigir automaticamente
- Nunca usar Place ID como location name na GBP API

### Score
- DEVE refletir dados reais: fotos, descricao, horarios, atributos, reviews
- CHECK constraints do banco DEVEM permitir os valores maximos do scorer
- attributeCount DEVE suportar tanto array (GBP API) quanto object (onboarding)

### Dados do Onboarding
- services, attributes, differentials do onboarding NAO podem ser sobrescritos por arrays vazios
- O gbp-audit faz merge inteligente: so sobrescreve se GBP API retornar dados nao-vazios

### Optimizer
- audit_report pode vir em 2 formatos: {issues} (score-calculator) ou {gaps} (audit-engine)
- O optimizer DEVE normalizar antes de processar
- Severity aceita PT (critico/importante) e EN (critical/high/medium)

### Dashboard
- Mapa: fallback com coordenadas do perfil quando geo_snapshots vazio
- Checklist: auto-detect itens feitos via dados do gbp_profiles (photo_count, reviews)
- Optimization wizard: mostrar erro real da API, nao mensagem generica

## Regras de Copy (INEGOCIAVEL)

- **Acentuacao perfeita** em 100% dos textos gerados (descricoes, posts, reviews, emails)
- **Zero erros gramaticais** em portugues brasileiro
- **Sem travessao (—)** em nenhum texto (regra global do CLAUDE.md)
- **Descricao: otimizar a existente**, nao substituir. Manter tom e essencia, enriquecer com keywords.
- **Modo manual** afeta apenas posts e review responses. Otimizacoes basicas (categorias, atributos, descricao) sao aplicadas automaticamente.

## Origem

Regra criada apos emergencia com Paula Bacellar (1a cliente paga, 2026-10-22/23).
10 bugs criticos identificados e corrigidos em sessao noturna.
Score corrigido de 29/100 para 43/100.
