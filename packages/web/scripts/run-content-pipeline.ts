#!/usr/bin/env npx tsx
// =============================================================================
// Script para rodar o Content Pipeline localmente via CLI
// Uso: npx tsx scripts/run-content-pipeline.ts
// =============================================================================

import fs from 'fs'
import path from 'path'

// Carrega .env.local manualmente (Next.js faz isso automatico, tsx nao)
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    // Remove aspas ao redor do valor
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvLocal()

import { runContentPipeline } from '../src/lib/content/orchestrator'

async function main() {
  console.log('=== DESTAKA Content Pipeline ===')
  console.log(`Inicio: ${new Date().toISOString()}`)
  console.log('')

  try {
    const report = await runContentPipeline()

    console.log('')
    console.log('=== RELATORIO ===')
    console.log(`Periodo: ${report.calendar.period.start} a ${report.calendar.period.end}`)
    console.log(`Artigos gerados: ${report.articlesGenerated}`)
    console.log(`Posts LinkedIn: ${report.linkedinPostsGenerated}`)
    console.log(`Posts Instagram: ${report.instagramPostsGenerated}`)
    console.log(`Total de arquivos: ${report.files.length}`)
    console.log('')

    if (report.files.length > 0) {
      console.log('Arquivos criados:')
      for (const f of report.files) {
        console.log(`  - ${f}`)
      }
    }

    if (report.errors.length > 0) {
      console.log('')
      console.log(`Erros (${report.errors.length}):`)
      for (const e of report.errors) {
        console.log(`  ! ${e}`)
      }
    }

    console.log('')
    console.log(`Duracao: ${((new Date(report.completedAt).getTime() - new Date(report.startedAt).getTime()) / 1000).toFixed(1)}s`)
    console.log(`Fim: ${report.completedAt}`)
  } catch (err) {
    console.error('Pipeline falhou:', err)
    process.exit(1)
  }
}

main()
