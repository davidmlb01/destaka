# Product Checklist — Verificacao Obrigatoria Antes de Entregar

## Regra Central

**NENHUMA entrega e considerada "feita" sem passar por este checklist.** Isso se aplica a: features novas, bug fixes que mudam a UI, correcoes de dados, qualquer coisa que a usuaria final veja ou interaja.

Este checklist NAO substitui o quality gate tecnico (codigo, build, seguranca). E um gate ADICIONAL que roda DEPOIS do tecnico e ANTES de dizer "feito" ao David.

## Checklist (todos os itens obrigatorios)

### 1. Perspectiva da usuaria

- [ ] Simulei o fluxo completo como se fosse a Paula abrindo o dashboard
- [ ] A tela mostra exatamente o que foi combinado (numeros, textos, status)
- [ ] Nenhum dado antigo/resolvido reaparece como pendente
- [ ] Se um item ja foi tratado em sessao anterior, ele nao volta

### 2. Edicao e controle

- [ ] Todo conteudo gerado por IA e editavel antes de publicar
- [ ] Campos de texto tem textarea ou input (nunca texto estatico nao editavel)
- [ ] A usuaria pode aprovar, editar, ou rejeitar qualquer sugestao
- [ ] Nenhuma acao irreversivel acontece sem confirmacao

### 3. Consistencia de dados

- [ ] O score mostrado e o que foi combinado (formula unica, sem divergencia)
- [ ] Contagens e badges refletem o estado real do banco
- [ ] Itens marcados como aplicados/resolvidos nao reaparecem
- [ ] Dados zombie/duplicados foram limpos (nao so ignorados)

### 4. Fluxo ponta a ponta

- [ ] O caminho inteiro funciona: gerar > ver na UI > editar > aprovar > publicar
- [ ] Se o modo e manual, NADA publica sem aprovacao da usuaria
- [ ] Se o cron gera algo, a usuaria e notificada (email ou badge no dashboard)
- [ ] Erros mostram mensagem util (nao silencio, nao erro tecnico)

### 5. Decisoes anteriores

- [ ] Reli as decisoes tomadas nesta sessao e em sessoes anteriores
- [ ] Nenhuma decisao foi revertida sem autorizacao do David
- [ ] Thresholds, formulas, frequencias sao os que foram combinados
- [ ] Se David disse "X", o sistema faz X (nao uma variacao de X)

## Quando rodar

- Antes de dizer "feito", "corrigido", "deployado" ou equivalente
- Antes de fazer commit de feature/fix que afeta a UI
- Antes de responder "tudo funcionando" ao David

## Como rodar

1. Ler cada item acima
2. Para cada item, verificar no codigo OU no banco OU na UI
3. Se um item falhar: corrigir ANTES de entregar
4. Se nao tiver certeza: perguntar ao David, nao assumir

## Anti-patterns (erros que este checklist previne)

| Erro real | Item que previne |
|-----------|-----------------|
| Score 71 vs 85, duas formulas | 3: "score mostrado e o combinado" |
| Atributos ja resolvidos reaparecendo | 1: "nenhum dado antigo reaparece" + 3: "itens aplicados nao reaparecem" |
| Descricao de servico sem campo de edicao | 2: "todo conteudo gerado por IA e editavel" |
| Posts sem keywords de bairro | 5: "se David disse X, o sistema faz X" |
| 3 posts em vez de 5 | 5: "frequencias sao as combinadas" |
| Shortcut do Instagram pulando geracao | 4: "caminho inteiro funciona" |
| 37 respostas zombie para reviews ja respondidos | 3: "dados zombie foram limpos" |
| applied_sections marcando servicos como aplicados sem estarem | 1: "nenhum dado antigo reaparece como pendente" |

## Severidade

Este checklist tem a mesma severidade do Gate 4 (Entrega Final) do quality-gates.md. Nao e pulado "para economizar tempo". Se um item falha, a entrega volta para correcao.
