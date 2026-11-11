# Investigacao: Crash na pagina /dashboard/competitors

**Data:** 2026-11-10
**Status:** Causa raiz identificada, fix proposto, nao implementado

---

## Resumo executivo

A pagina `/dashboard/competitors` crasha client-side com "Algo deu errado" (error boundary) porque o componente `BenchmarkCard` acessa propriedades de um objeto JSONB (`benchmark_data`) sem optional chaining. O `benchmark_data` e gerado por Claude via `generateBenchmark()` e armazenado no banco sem validacao de schema. Se Claude omitir os campos `alerts` ou `gaps` do JSON, o acesso `.length` em `undefined` lanca TypeError.

---

## Causa raiz (Crash Point 1, PRINCIPAL)

**Arquivo:** `/src/components/dashboard/CompetitorsContent.tsx`
**Linhas:** 38 e 49 (dentro de `BenchmarkCard`)

```tsx
// Linha 38 — CRASH se data.alerts e undefined
{data.alerts.length > 0 && (

// Linha 49 — CRASH se data.gaps e undefined
{data.gaps.length > 0 && (
```

### Cadeia de evidencias

1. `benchmark_data` e gerado em `/src/lib/gmb/competitors.ts` linhas 316-328:
   ```ts
   const parsed = JSON.parse(jsonMatch[0]) as Omit<BenchmarkData, 'generated_at'>
   const benchmarkData: BenchmarkData = { ...parsed, generated_at: new Date().toISOString() }
   ```
   O `as` cast NAO valida se `alerts` e `gaps` existem no JSON retornado por Claude.

2. O prompt de Claude (linhas 306-312) pede o formato:
   ```json
   { "summary": "...", "strengths": [...], "gaps": [...], "alerts": [...] }
   ```
   Porem Claude pode retornar JSON sem todos os campos (ex: `{"summary": "..."}`).

3. O dado e armazenado como JSONB na tabela `competitors` (coluna `benchmark_data`) sem constraint de schema.

4. A API GET `/api/competitors` (route.ts linha 100) passa o campo direto:
   ```ts
   benchmark_data: c.benchmark_data,
   ```

5. No componente, a verificacao `comp.benchmark_data && <BenchmarkCard data={...} />` (linha 133) so valida truthiness do objeto. Um objeto `{"summary": "..."}` e truthy, mas nao tem `alerts` nem `gaps`.

6. Dentro de `BenchmarkCard`, `data.alerts.length` lanca:
   ```
   TypeError: Cannot read properties of undefined (reading 'length')
   ```

7. O error boundary em `/src/app/(dashboard)/dashboard/error.tsx` captura e mostra "Algo deu errado".

### Por que outras paginas funcionam

- A pagina principal do dashboard (`/dashboard`) NAO usa `useCompetitors` nem renderiza `BenchmarkCard`.
- `Reviews`, `Posts`, `Optimizations` nao carregam dados de competidores.
- O crash so acontece quando existe pelo menos 1 competidor com `benchmark_data` que tenha campos faltando.

---

## Causa raiz (Crash Point 2, SECUNDARIO)

**Arquivo:** `/src/components/dashboard/CompetitorsContent.tsx`
**Linha:** 180 e 185 (dentro de `OpportunitiesSection`)

```tsx
// Linha 180
const cfg = PRIORITY_CONFIG[gap.priority]

// Linha 185 — CRASH se cfg e undefined (priority invalido)
style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
```

`PRIORITY_CONFIG` so tem chaves `high`, `medium`, `low` (linha 138-142). Se algum gap no banco tiver `priority` com valor diferente (ex: `"critical"`, `null`, `undefined`), `cfg` sera `undefined` e o acesso a `cfg.bg` crasha.

### Evidencia

Os gaps sao gerados por `analyzeCompetitivePosition` em `/src/lib/gmb/competitive-analyzer.ts` que hardcoda `priority` como `'high'`, `'medium'`, ou `'low'`. Isso torna esse crash MENOS provavel, mas possivel se o dado foi inserido manualmente ou corrompido.

---

## Causa raiz (Crash Point 3, TERCIARIO)

**Arquivo:** `/src/components/dashboard/CompetitorsContent.tsx`
**Linha:** 197

```tsx
// Linha 197 — CRASH se gap.missing e undefined
{gap.missing.length > 0 && (
```

Se algum gap na `competitive_analyses` nao tiver o campo `missing`, o acesso `.length` crasha. Mesma classe de problema: dados JSONB sem validacao de schema.

---

## Fix proposto

### Fix 1: BenchmarkCard (CRITICO, resolve o crash principal)

Adicionar optional chaining e fallback para arrays:

```tsx
// CompetitorsContent.tsx, linha 38 — ANTES:
{data.alerts.length > 0 && (

// DEPOIS:
{(data.alerts?.length ?? 0) > 0 && (
```

```tsx
// CompetitorsContent.tsx, linha 49 — ANTES:
{data.gaps.length > 0 && (

// DEPOIS:
{(data.gaps?.length ?? 0) > 0 && (
```

Tambem trocar os `.map()` internos para usar optional chaining:

```tsx
// Linha 40 — ANTES:
{data.alerts.map((a, i) => (

// DEPOIS:
{(data.alerts ?? []).map((a, i) => (
```

```tsx
// Linha 51 — ANTES:
{data.gaps.map((g, i) => (

// DEPOIS:
{(data.gaps ?? []).map((g, i) => (
```

### Fix 2: OpportunitiesSection (DEFENSIVO)

```tsx
// Linha 180 — ANTES:
const cfg = PRIORITY_CONFIG[gap.priority]

// DEPOIS:
const cfg = PRIORITY_CONFIG[gap.priority] ?? PRIORITY_CONFIG.medium
```

```tsx
// Linha 197 — ANTES:
{gap.missing.length > 0 && (

// DEPOIS:
{(gap.missing?.length ?? 0) > 0 && (
```

```tsx
// Linha 199 — ANTES:
{gap.missing.slice(0, 5).map((item: string, j: number) => (

// DEPOIS:
{(gap.missing ?? []).slice(0, 5).map((item: string, j: number) => (
```

### Fix 3: Validacao na geracao do benchmark (PREVENTIVO)

Em `/src/lib/gmb/competitors.ts` linha 327, adicionar validacao:

```tsx
// ANTES:
const parsed = JSON.parse(jsonMatch[0]) as Omit<BenchmarkData, 'generated_at'>
const benchmarkData: BenchmarkData = { ...parsed, generated_at: new Date().toISOString() }

// DEPOIS:
const raw = JSON.parse(jsonMatch[0])
const benchmarkData: BenchmarkData = {
  summary: typeof raw.summary === 'string' ? raw.summary : '',
  strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
  gaps: Array.isArray(raw.gaps) ? raw.gaps : [],
  alerts: Array.isArray(raw.alerts) ? raw.alerts : [],
  generated_at: new Date().toISOString(),
}
```

### Fix 4: Validacao na API de analysis (DEFENSIVO)

Em `/src/lib/gmb/competitive-analyzer.ts` linha 322-328, adicionar validacao:

```tsx
// ANTES:
return {
  analyzed_at: data.analyzed_at,
  competitor_count: 3,
  gaps: data.gaps as CompetitiveGap[],
  keyword_opportunities: data.keyword_opportunities as string[],
  summary: data.summary ?? '',
}

// DEPOIS:
return {
  analyzed_at: data.analyzed_at,
  competitor_count: 3,
  gaps: Array.isArray(data.gaps) ? (data.gaps as CompetitiveGap[]) : [],
  keyword_opportunities: Array.isArray(data.keyword_opportunities) ? (data.keyword_opportunities as string[]) : [],
  summary: typeof data.summary === 'string' ? data.summary : '',
}
```

---

## Arquivos envolvidos

| Arquivo | Papel |
|---------|-------|
| `src/components/dashboard/CompetitorsContent.tsx` | Componente com os crash points (linhas 38, 49, 180, 197) |
| `src/lib/gmb/competitors.ts` | Gera benchmark_data via Claude sem validacao (linha 327) |
| `src/lib/gmb/competitive-analyzer.ts` | Le analysis do DB com cast sem validacao (linha 325) |
| `src/app/api/competitors/route.ts` | API passa benchmark_data direto do DB (linha 100) |
| `src/app/api/competitors/analysis/route.ts` | API retorna analysis do DB |
| `src/app/(dashboard)/dashboard/error.tsx` | Error boundary que mostra "Algo deu errado" |

---

## Ordem de implementacao recomendada

1. **Fix 1** (BenchmarkCard optional chaining) — resolve o crash imediato
2. **Fix 3** (validacao no generateBenchmark) — previne dados malformados futuros
3. **Fix 2** (OpportunitiesSection defensivo) — protecao adicional
4. **Fix 4** (validacao na API de analysis) — protecao de borda

Fixes 1 e 2 sao no mesmo arquivo (`CompetitorsContent.tsx`).
Fix 3 e no arquivo de geracao (`competitors.ts`).
Fix 4 e no arquivo de leitura (`competitive-analyzer.ts`).
