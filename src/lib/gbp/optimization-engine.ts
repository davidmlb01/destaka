// GBP Optimization Engine — Story 006
// Gera sugestões de categorias, atributos, 3 versões de descrição e serviços otimizados

import { generateContent } from '@/lib/ai/client'
import type { AuditReport, AuditGap } from './audit-engine'

export interface DescriptionVariant {
  focus: 'seo' | 'conversao' | 'confianca'
  label: string
  text: string
  char_count: number
}

export interface ServiceOptimization {
  original: string
  optimized: string
  keywords_added: string[]
}

export interface OptimizationReport {
  generated_at: string
  category_suggestions: Array<{
    category: string
    justification: string
    used_by_competitors: boolean
  }>
  attribute_suggestions: Array<{
    attribute: string
    justification: string
  }>
  description_variants: DescriptionVariant[]
  service_optimizations: ServiceOptimization[]
  photo_naming: {
    convention: string
    examples: string[]
  }
  priority_order: string[]
}

export async function generateOptimizations(params: {
  auditReport: AuditReport
  specialty: string
  professionalName: string
  city: string
  currentDescription: string | null
  currentCategories: string[]
  currentServices: string[]
  competitorCategories?: string[][]
}): Promise<OptimizationReport> {
  const {
    auditReport, specialty, professionalName, city,
    currentDescription, currentCategories, currentServices,
    competitorCategories = [],
  } = params

  const criticalGaps = auditReport.gaps.filter((g: AuditGap) => g.severity === 'critico')
  const importantGaps = auditReport.gaps.filter((g: AuditGap) => g.severity === 'importante')

  const allCompetitorCats = [...new Set(competitorCategories.flat())]
  const missingFromCompetitors = allCompetitorCats.filter(
    c => !currentCategories.some(cc => cc.toLowerCase().includes(c.toLowerCase()))
  )

  const prompt = `Você é especialista em SEO local para ${specialty} no Brasil.

PERFIL ATUAL:
- Nome: ${professionalName}
- Especialidade: ${specialty}
- Cidade: ${city}
- Descrição atual: ${currentDescription ?? '(vazia)'}
- Categorias atuais (${currentCategories.length}): ${currentCategories.join(', ') || '(nenhuma)'}
- Serviços atuais (${currentServices.length}): ${currentServices.slice(0, 10).join(', ') || '(nenhum)'}

GAPS DA AUDITORIA:
${criticalGaps.map((g: AuditGap) => `CRÍTICO: ${g.title} — ${g.action}`).join('\n')}
${importantGaps.map((g: AuditGap) => `IMPORTANTE: ${g.title} — ${g.action}`).join('\n')}

CATEGORIAS USADAS POR CONCORRENTES QUE FALTAM:
${missingFromCompetitors.join(', ') || '(sem dados)'}

Gere um relatório de otimização completo com este JSON:
{
  "category_suggestions": [
    { "category": "nome da categoria GBP", "justification": "por que adicionar", "used_by_competitors": true/false }
  ],
  "attribute_suggestions": [
    { "attribute": "nome do atributo", "justification": "impacto esperado" }
  ],
  "description_variants": [
    {
      "focus": "seo",
      "label": "Focada em palavras-chave",
      "text": "descrição de 250-750 chars com keywords naturais de ${specialty} em ${city}"
    },
    {
      "focus": "conversao",
      "label": "Focada em conversão",
      "text": "descrição com diferenciais claros e chamada para ação"
    },
    {
      "focus": "confianca",
      "label": "Focada em credibilidade",
      "text": "descrição com experiência, formação e resultados (sem prometer resultados clínicos)"
    }
  ],
  "service_optimizations": [
    { "original": "nome original", "optimized": "nome otimizado com keyword", "keywords_added": ["kw1"] }
  ],
  "photo_naming": {
    "convention": "padrão recomendado de nomeação de fotos",
    "examples": ["exemplo1.jpg", "exemplo2.jpg", "exemplo3.jpg"]
  },
  "priority_order": ["o que fazer primeiro", "segundo", "terceiro"]
}

REGRAS:
- Descrições entre 250 e 750 caracteres
- Sem travessão (—)
- Sem promessa de resultado clínico
- Keywords de localização (${city}) inseridas naturalmente
- Máximo 5 sugestões de categoria, 5 de atributo, 5 de otimização de serviço

Retorne APENAS o JSON, sem texto adicional.`

  const systemPrompt = `Você é especialista em Google Business Profile e SEO local para saúde no Brasil. Conhece as normas do CFM, CRO, COFFITO e CFP. Responda em português brasileiro. Retorne apenas JSON válido.`

  try {
    const raw = await generateContent(prompt, systemPrompt)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Omit<OptimizationReport, 'generated_at'>

      // Adiciona char_count nas descrições
      const variants: DescriptionVariant[] = (parsed.description_variants ?? []).map(v => ({
        ...v,
        char_count: v.text?.length ?? 0,
      }))

      return {
        generated_at: new Date().toISOString(),
        category_suggestions: parsed.category_suggestions ?? [],
        attribute_suggestions: parsed.attribute_suggestions ?? [],
        description_variants: variants,
        service_optimizations: parsed.service_optimizations ?? [],
        photo_naming: parsed.photo_naming ?? {
          convention: `${specialty.toLowerCase()}-${city.toLowerCase().replace(/\s/g, '-')}-[descricao]-[numero].jpg`,
          examples: [
            `${specialty.toLowerCase()}-${city.toLowerCase()}-recepcao-01.jpg`,
            `${specialty.toLowerCase()}-${city.toLowerCase()}-fachada-01.jpg`,
          ],
        },
        priority_order: parsed.priority_order ?? [],
      }
    }
  } catch {
    // fallback abaixo
  }

  return getFallbackReport(specialty, city, currentDescription, missingFromCompetitors)
}

function getFallbackReport(
  specialty: string,
  city: string,
  currentDescription: string | null,
  missingCategories: string[]
): OptimizationReport {
  const slug = `${specialty.toLowerCase()}-${city.toLowerCase().replace(/\s/g, '-')}`

  return {
    generated_at: new Date().toISOString(),
    category_suggestions: missingCategories.slice(0, 3).map(c => ({
      category: c,
      justification: 'Categoria usada por concorrentes na mesma região.',
      used_by_competitors: true,
    })),
    attribute_suggestions: [
      { attribute: 'Aceita convênios', justification: 'Muito buscado por pacientes no Google Maps.' },
      { attribute: 'Acessível para cadeirantes', justification: 'Melhora visibilidade para buscas com filtro de acessibilidade.' },
    ],
    description_variants: [
      {
        focus: 'seo',
        label: 'Focada em palavras-chave',
        text: `${specialty} em ${city}. Atendimento especializado com foco na saúde e bem-estar dos pacientes. Agende sua consulta.`,
        char_count: 0,
      },
      {
        focus: 'conversao',
        label: 'Focada em conversão',
        text: currentDescription ?? `Oferecemos atendimento de qualidade em ${city}. Nossa equipe está pronta para cuidar de você. Agende agora.`,
        char_count: 0,
      },
      {
        focus: 'confianca',
        label: 'Focada em credibilidade',
        text: `Profissional de ${specialty} com dedicação ao atendimento humanizado em ${city}. Cada paciente recebe atenção individual e cuidado completo.`,
        char_count: 0,
      },
    ],
    service_optimizations: [],
    photo_naming: {
      convention: `${slug}-[descricao]-[numero].jpg`,
      examples: [`${slug}-recepcao-01.jpg`, `${slug}-fachada-01.jpg`, `${slug}-equipe-01.jpg`],
    },
    priority_order: [
      'Adicionar descrição ao perfil',
      'Configurar categorias secundárias',
      'Ativar atributos disponíveis',
    ],
  }
}
