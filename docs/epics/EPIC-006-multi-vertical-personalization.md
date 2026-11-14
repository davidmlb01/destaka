# EPIC-006: Personalização Multi-Vertical

**Status:** IN PROGRESS (Waves 1-4 DONE, Wave 5 pendente)
**Prioridade:** CRITICAL (bloqueante para beta)
**Criado:** 2026-11-14
**Owner:** @pm (Morgan)

---

## Contexto

O Destaka foi construido e testado exclusivamente com um perfil de saude (Paula Bacellar, fisioterapeuta). Toda a stack de IA, discovery de concorrentes, audit de perfil e geração de conteudo assume que o usuario é profissional de saude.

Existe um sistema de vocabulario por vertical (`vertical-vocab.ts`) com 9 verticais + default, mas ele é ignorado por todos os engines de IA e pela maioria das páginas.

**Evidencia concreta:** A conta UNLMTD (consultoria de marketing) recebe posts sobre "prevenção e saúde", mostra "Tudo otimizado!" com perfil incompleto, encontra 0 concorrentes, e passaria por validação de compliance CFM/CRO como se fosse clínica médica.

**Impacto:** Qualquer usuario não-saude que entrar no Destaka terá experiencia quebrada. Isso bloqueia o beta com a Marina (floricultura) e qualquer expansão multi-vertical.

---

## Análise de Causa Raiz

### 7 falhas sistêmicas identificadas

| # | Falha | Onde | Impacto |
|---|-------|------|---------|
| 1 | **Prompts de IA hardcoded para saude** | Todos os 7 engines que chamam Claude | Posts, respostas de reviews, audits, otimizações, análise competitiva gerados com frame de "profissional de saude", CFM/CRO/COFFITO |
| 2 | **Specialty não propaga para engines** | `getVocab()` nunca chamado por nenhum engine | O vocabulario personalizado existe mas é ignorado |
| 3 | **Fallback de specialty = saude** | `SPECIALTY_CONTEXT.outro`, `SPECIALTY_TO_PLACES_TYPE`, `buildCompetitorQuery()` | Qualquer vertical desconhecida cai em "saude, bem-estar, qualidade de vida" |
| 4 | **Discovery de concorrentes quebrado** | `places-client.ts` mapeia apenas 9 specialties de saude | `'negócio local'` busca type `health` na Places API, retorna 0 para não-saude |
| 5 | **Audit/Optimizer com race condition** | Optimizer roda antes do audit completar | `audit_report` null = optimizer retorna skip = "Tudo otimizado!" |
| 6 | **Specialty definida 1x e nunca corrigida** | `detectSegment()` no auth callback | Sem UI para usuario corrigir. "Consultoria de marketing" vira `'negócio local'` para sempre |
| 7 | **9 pontos de UI com copy hardcoded** | Onboarding, Kit Reviews, Plan, Upgrade, emails, páginas públicas | "pacientes", "clínica", "consulta" aparecem para qualquer vertical |

### Engines afetados (detalhe)

| Engine | Lê specialty? | Usa getVocab()? | Prompts saude? | Impacto |
|--------|:---:|:---:|:---:|---------|
| post-generator-engine.ts | Sim | Não | Sim | Posts sobre saude para qualquer negócio |
| review-response-engine.ts | Sim | Não | Sim | Respostas com tom de clínica |
| audit-engine.ts | Sim | Não | Sim | Audit com frame de consultório |
| optimization-engine.ts | Sim | Não | Sim | Sugestões de otimização com CFM/CRO |
| competitor-engine.ts | Sim | Não | Sim | Análise competitiva para clínicas |
| compliance-validator.ts | Não | Não | Sim | Valida todo post contra regras do CFM |
| reviews/analyzer.ts | Não | Não | Sim | "analista de pacientes em clínicas" |
| gap-analyzer.ts | Não | Não | Copy saude | "solicitar avaliações aos seus pacientes" |
| plan-generator.ts | Não | Não | Copy saude | "Peça uma avaliação ao final de cada consulta" |

---

## Plano de Execução

### Wave 1: Infraestrutura (bloqueante, fazer primeiro)

**Story 6.1: Expandir VerticalVocab como contrato central**

Expandir `vertical-vocab.ts` com todos os campos necessários para engines, UI e emails:
- `servicePlaceholders[]`: exemplos de serviços por vertical
- `whatsappMessages[]`: mensagens do Kit Reviews por vertical
- `complianceContext`: regras de compliance por vertical (CFM para saude, OAB para juridico, nenhum para genérico)
- `postKeywords`: contexto temático para geração de posts
- `searchType`: tipo Places API para discovery de concorrentes
- `searchKeyword`: keyword de busca para concorrentes
- `auditContext`: frame de referencia para o audit engine

Adicionar verticais faltantes: `floricultura`, `marketing/consultoria`, `fotografia`, `educação`, `tecnologia`.

Criar `getEngineContext(specialty)` que retorna tudo que um engine precisa em um único objeto.

**Story 6.2: Specialty editável no onboarding e dashboard**

- Adicionar step no onboarding onde usuario confirma/corrige sua categoria
- Adicionar opção no dashboard (Settings ou Perfil) para alterar specialty
- `detectSegment()` vira sugestão inicial, não definição final
- Expandir `detectSegment()` para cobrir mais categorias GBP (marketing, consultoria, floricultura, fotografia, etc.)

---

### Wave 2: Engines de IA (o núcleo do problema)

**Story 6.3: Post Generator multi-vertical**

- System prompt dinâmico baseado em `getEngineContext(specialty)`
- Remover `SPECIALTY_CONTEXT` hardcoded, usar vocab
- Remover compliance CFM/CRO do prompt para não-saude
- `POST_TYPE_LABEL.educativo` adaptado por vertical ("dica de saude" vs "dica de arranjo floral" vs "dica de marketing")
- Fallbacks de post por vertical (não mais "cuidar da saude")

**Story 6.4: Review Response Engine multi-vertical**

- System prompt dinâmico: "especialista em reputação online para {vertical}" em vez de "profissionais de saude"
- Remover CFM/CRO/COFFITO do prompt para não-saude
- `STAR_STRATEGY` exemplos genéricos, não "clínica odontológica em São Paulo"
- Compliance rules condicionais por vertical

**Story 6.5: Audit Engine multi-vertical**

- System prompt: "especialista em SEO local para {vertical} no Brasil"
- User prompt: substituir "profissionais de saude" por contexto dinâmico
- `generateRuleBasedGaps()` fallbacks genéricos ("Seu perfil não tem X" em vez de "Consultórios com mais fotos")
- Remover "Aceita convênios" como gap genérico

**Story 6.6: Optimization Engine multi-vertical**

- System prompt dinâmico sem CFM/CRO para não-saude
- Fallback `description_variants` sem "saude e bem-estar dos pacientes"
- Sugestões de categorias baseadas na vertical real

**Story 6.7: Competitor Engine multi-vertical**

- System prompt dinâmico: "inteligência competitiva para {vertical}"
- Não mais "clínicas de saude no Brasil" para todo mundo

**Story 6.8: Compliance Validator condicional**

- CFM/CRO/COFFITO apenas para vertical saude
- OAB para jurídico
- Genérico (sem compliance profissional) para demais
- Manter regras universais (não difamar concorrente, não prometer resultado impossível)

**Story 6.9: Reviews Analyzer multi-vertical**

- System prompt: "analista de avaliações de {vocab.clientes} em {vocab.local}" em vez de "pacientes em clínicas de saude"

---

### Wave 3: Competitor Discovery (feature quebrada)

**Story 6.10: PlacesClient multi-vertical**

- Expandir `SPECIALTY_TO_PLACES_TYPE` para todas as verticais:
  - `floricultura` → type `florist`, keyword `floricultura`
  - `marketing` → type `marketing_agency`, keyword `agência de marketing`
  - `advogado` → type `lawyer`, keyword `advogado escritório`
  - `veterinário` → type `veterinary_care`, keyword `veterinário clínica`
  - etc.
- Fallback inteligente: usar `category` do GBP direto como keyword, não assumir saude
- Garantir que `'negócio local'` busque pela categoria real do GBP

**Story 6.11: Fix race condition Audit → Optimizer**

- Optimizer deve esperar audit completar (dependency no Inngest: `destaka/gbp.audit.completed` → trigger optimizer)
- Nunca retornar "Tudo otimizado!" se `audit_report` é null
- Se audit_report null, mostrar "Analisando seu perfil..." em vez de "Tudo otimizado!"

---

### Wave 4: UI Copy (os 9 pontos + extras)

**Story 6.12: Substituir copy hardcoded por getVocab()**

9 pontos identificados + 3 condicionais:

| Arquivo | Fix |
|---------|-----|
| `onboarding/page.tsx:507-509` | `servicePlaceholders` do vocab |
| `kit-reviews/KitReviewsContent.tsx:19,22,111,129` | Mensagens e labels do vocab |
| `d/[hash]/page.tsx:202-205` | `tagline` do vocab |
| `dashboard/plan/page.tsx:46,95` | `tagline` e `clientes` do vocab |
| `dashboard/upgrade/page.tsx:9-10` | `local` e `clientes` do vocab |
| `monthly-report.ts:302` | `clientes` do vocab |
| `r/[slug]/page.tsx:113` | `clientes` do vocab |
| `plan-generator.ts` (5 strings) | `clientes`, `local`, `atendimento` do vocab |
| `gap-analyzer.ts:137` | `clientes` do vocab |
| `competitor-alert.ts:70` | `clientes` do vocab |
| `review-solicitation.ts:109,119,127` | `clientes` do vocab |
| `verificar/page.tsx:8` | Meta description genérica |

---

### Wave 5: Validação

**Story 6.13: Test suite multi-vertical**

- Criar teste automatizado que roda o fluxo completo com 3 perfis:
  1. Saude (fisioterapeuta) - regressão, deve continuar funcionando
  2. Floricultura (A Bela do Dia) - vertical genérica
  3. Jurídico (advogado) - vertical com compliance próprio
- Validar: posts gerados, respostas de reviews, audit, optimizer, concorrentes, UI copy
- Nenhum texto de saude deve aparecer para perfis não-saude (exceto vertical saude)
- Nenhum "Tudo otimizado!" para perfil incompleto

---

## Dependências

- Nenhuma dependência externa
- Wave 1 bloqueia todas as outras
- Wave 2 e 3 podem rodar em paralelo após Wave 1
- Wave 4 pode começar junto com Wave 2
- Wave 5 roda após todas as outras

## Critérios de Aceite da EPIC

1. Um usuario de floricultura faz signup e vê todo o fluxo personalizado (zero menção a saude/pacientes/clínica)
2. Posts gerados refletem o nicho real do negócio
3. Concorrentes encontrados são do mesmo nicho
4. Audit identifica gaps reais do perfil (fotos, descrição, horários)
5. "Tudo otimizado!" nunca aparece para perfil incompleto
6. Compliance CFM/CRO só aparece para vertical saude
7. Perfil da Paula (saude) continua funcionando sem regressão

## Estimativa

- 13 stories em 5 waves
- Wave 1 (infra): 2 stories
- Wave 2 (engines IA): 7 stories
- Wave 3 (competitor): 2 stories
- Wave 4 (UI copy): 1 story
- Wave 5 (validação): 1 story
