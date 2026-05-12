// =============================================================================
// DESTAKA Content Pipeline — Writer Agent
// Gera artigos MDX, posts LinkedIn e captions Instagram
// =============================================================================

import { getAnthropic, AI_MODEL_FAST } from '@/lib/ai'
import { logger } from '@/lib/logger'
import type { SingleBrief } from './types'

const SERVICE = 'content/writer'

// =============================================================================
// Blog Article (MDX)
// =============================================================================

/**
 * Gera artigo completo em MDX com frontmatter, componentes e CTAs.
 */
export async function writeArticle(brief: SingleBrief): Promise<string> {
  const anthropic = getAnthropic()
  const { blogPost } = brief

  const schemaInstructions = {
    article: `Escreva um artigo informativo e pratico com ${blogPost.targetWordCount} palavras.
Estrutura: introducao com gancho, 3-5 secoes com H2, conclusao com CTA.
Inclua dados, exemplos reais e dicas acionaveis.`,
    faq: `Escreva um FAQ com 5-8 perguntas e respostas sobre o tema.
Cada pergunta deve ser uma duvida REAL que dentistas/medicos tem.
Use o componente <FAQ> para estruturar.
No frontmatter, inclua faqItems com q e a para cada pergunta.
Mantenha entre 300-500 palavras.`,
    howto: `Escreva um guia passo a passo com ${blogPost.targetWordCount} palavras.
Estrutura: por que isso importa, pre-requisitos, passos numerados com H3, resultado esperado.
Cada passo deve ser claro e acionavel, com screenshots imaginarios descritos.`,
  }

  const prompt = `Voce e o redator senior do Destaka, plataforma de presenca digital para profissionais de saude brasileiros.

## Tarefa
Escreva um ${blogPost.schema === 'faq' ? 'FAQ' : blogPost.schema === 'howto' ? 'guia passo a passo' : 'artigo'} completo em formato MDX.

## Briefing
- Keyword principal: "${blogPost.keyword}"
- Keywords secundarias: ${blogPost.secondaryKeywords.map((k) => `"${k}"`).join(', ')}
- Titulo sugerido: "${blogPost.suggestedTitle}"
- Tipo: ${blogPost.schema}
- Palavras alvo: ${blogPost.targetWordCount}
- Tier: ${blogPost.tier} (${blogPost.tier === 1 ? 'long-form premium' : blogPost.tier === 2 ? 'artigo medio' : 'FAQ curto'})

## Instrucoes de formato
${schemaInstructions[blogPost.schema]}

## Componentes MDX disponiveis
- <Callout> — destaque para dica importante ou aviso. Uso: <Callout>texto</Callout>
- <StatCard> — dado estatistico relevante. Uso: <StatCard value="76%" label="dos pacientes pesquisam no Google antes de agendar" />
- <CTABox /> — call-to-action para diagnostico gratuito. OBRIGATORIO: inserir 1x no meio do artigo (~40% do texto) e 1x no final
- <FAQ> — bloco de perguntas e respostas. Uso: <FAQ items={[{q: "...", a: "..."}]} />

## Tom de voz
- Autoridade acessivel: voce sabe do que fala, mas nao e arrogante
- Direto: profissionais de saude nao tem tempo para enrolacao
- Empatico: entende a dor de quem esta invisivel no Google
- Nao-nativo digital: explica termos tecnicos de forma simples
- NUNCA use jargao de marketing sem explicar

## Regras absolutas
- NUNCA use travessao (—) em nenhum trecho. Use virgula, ponto, dois-pontos ou reescreva
- Portugues brasileiro com acentuacao 100% correta (ção, ão, ência, você, também, até)
- NUNCA invente dados estatisticos falsos. Se citar numeros, use fontes reais conhecidas (Google, HubSpot, etc.) ou use "segundo estudos" de forma generica
- Todo CTA aponta para /saude/verificar (diagnostico gratuito)
- O artigo deve ser UNICO, com exemplos especificos do nicho saude

## Formato de saida
Retorne o arquivo MDX completo incluindo frontmatter YAML entre --- e conteudo.

O frontmatter DEVE ter exatamente estes campos:
---
title: "${blogPost.suggestedTitle}"
description: "descricao SEO de 150-160 caracteres"
slug: "slug-em-kebab-case-sem-acentos"
category: "categoria relevante"
tags: ["tag1", "tag2", "tag3"]
author: "Destaka"
publishedAt: "${brief.date}"
updatedAt: "${brief.date}"
schema: "${blogPost.schema}"
featured: false
relatedPosts: []
${blogPost.schema === 'faq' ? 'faqItems:\n  - q: "pergunta 1"\n    a: "resposta 1"\n  - q: "pergunta 2"\n    a: "resposta 2"' : 'faqItems: []'}
---

Retorne APENAS o MDX completo, sem blocos de codigo markdown ao redor.`

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL_FAST,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    let text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // Remove blocos de codigo markdown se vieram
    text = text.replace(/^```mdx?\n?/gm, '').replace(/\n?```$/gm, '')

    // Sanitiza travessoes (seguranca extra)
    text = text.replace(/\u2014/g, ',').replace(/\u2013/g, ',')

    // Valida que tem frontmatter
    if (!text.startsWith('---')) {
      throw new Error('Artigo gerado sem frontmatter valido')
    }

    logger.info(SERVICE, `artigo gerado: ${blogPost.suggestedTitle}`, {
      schema: blogPost.schema,
      words: text.split(/\s+/).length,
    })

    return text
  } catch (err) {
    logger.error(SERVICE, `erro ao gerar artigo: ${blogPost.keyword}`, {
      err: String(err),
    })
    throw err
  }
}

// =============================================================================
// LinkedIn Post
// =============================================================================

/**
 * Gera post para LinkedIn no formato hook + desenvolvimento + CTA.
 */
export async function writeLinkedInPost(brief: SingleBrief): Promise<string> {
  const anthropic = getAnthropic()

  const prompt = `Voce e o estrategista de conteudo do Destaka no LinkedIn.

## Tarefa
Escreva um post de LinkedIn para profissionais de saude (dentistas, medicos).

## Briefing
- Angulo: ${brief.linkedin.angle}
- Hook sugerido: "${brief.linkedin.hook}"
- Keyword do blog relacionado: "${brief.blogPost.keyword}"

## Formato LinkedIn
1. HOOK (1-2 linhas): frase que para o scroll. Provocativa, curiosa ou contraintuitiva
2. ESPACO (linha em branco)
3. DESENVOLVIMENTO (5-8 linhas): insight principal, dados se possivel, exemplo pratico
4. ESPACO (linha em branco)
5. CTA: direciona para destaka.com.br ou /saude/verificar

## Tom
- Profissional mas nao corporativo
- Dados quando possivel
- Autoridade de quem entende o mercado de saude + digital
- Emojis: maximo 2, so se fizerem sentido

## Regras
- NUNCA use travessao (—). Use virgula, ponto ou dois-pontos
- Portugues brasileiro com acentuacao 100% correta
- Maximo 1300 caracteres (limite LinkedIn para preview)
- NUNCA use hashtags demais (maximo 3, ao final)

Retorne APENAS o texto do post, sem formatacao extra.`

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL_FAST,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    let text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    text = text.replace(/\u2014/g, ',').replace(/\u2013/g, ',')

    logger.info(SERVICE, `linkedin post gerado: ${brief.linkedin.angle}`)
    return text.trim()
  } catch (err) {
    logger.error(SERVICE, `erro ao gerar linkedin post`, { err: String(err) })
    throw err
  }
}

// =============================================================================
// Instagram Caption
// =============================================================================

interface InstagramOutput {
  type: 'carrossel' | 'reel'
  caption: string
  slides?: string[] // textos de cada slide (carrossel)
  hook?: string // frase de abertura do reel
  script?: string // roteiro resumido do reel
}

/**
 * Gera caption e conteudo para Instagram (carrossel ou estatico).
 */
export async function writeInstagramCaption(
  brief: SingleBrief
): Promise<InstagramOutput> {
  const anthropic = getAnthropic()
  const ig = brief.instagram!
  const isCarrossel = ig.type === 'carrossel'
  const numSlides = ig.slides ?? 6

  const prompt = `Voce e o criador de conteudo do Destaka para Instagram.

## Tarefa
Crie conteudo para ${isCarrossel ? `um carrossel de ${numSlides} slides` : 'um Reel de 30-60 segundos'}.

## Briefing
- Angulo: ${ig.angle}
- Tipo: ${ig.type}
- Keyword relacionada: "${brief.blogPost.keyword}"

${
  isCarrossel
    ? `## Formato carrossel
Crie ${numSlides} slides com:
- Slide 1: capa com headline provocativa
- Slides 2-${numSlides - 1}: conteudo educativo, 1 ideia por slide, texto curto (max 40 palavras por slide)
- Slide ${numSlides}: CTA para destaka.com.br/saude/verificar

Retorne um JSON com:
{
  "type": "carrossel",
  "caption": "legenda do post (max 300 caracteres, com CTA)",
  "slides": ["texto slide 1", "texto slide 2", ...]
}`
    : `## Formato Reel
Crie:
- Hook de abertura: frase de 1 linha que prende nos primeiros 2 segundos
- Roteiro resumido: 3-5 bullet points com o que falar em cada momento do reel (max 60 segundos total)
- Legenda: copy curto para a descricao do reel (max 200 caracteres, com CTA para destaka.com.br/saude/verificar)

Retorne um JSON com:
{
  "type": "reel",
  "caption": "legenda do reel",
  "hook": "frase de abertura que prende",
  "script": "bullet 1\\nbullet 2\\nbullet 3..."
}`
}

## Tom
- Educativo e direto
- Linguagem simples, nao-nativo digital
- Emojis: max 3 na legenda

## Regras
- NUNCA use travessao (—)
- Portugues brasileiro com acentuacao 100% correta
- Retorne APENAS o JSON, sem markdown

`

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL_FAST,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    let text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    text = text.replace(/\u2014/g, ',').replace(/\u2013/g, ',')

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Resposta do Instagram nao contem JSON valido')
    }

    const output = JSON.parse(jsonMatch[0]) as InstagramOutput

    logger.info(SERVICE, `instagram ${output.type} gerado: ${brief.instagram?.angle ?? 'sem angulo'}`)
    return output
  } catch (err) {
    logger.error(SERVICE, `erro ao gerar instagram post`, {
      err: String(err),
    })
    throw err
  }
}
