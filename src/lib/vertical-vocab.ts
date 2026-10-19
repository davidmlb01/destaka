// =============================================================================
// DESTAKA — Vocabulário por vertical
// Fonte canônica de termos personalizados por nicho.
// Usado em: dashboard, diagnóstico, onboarding, emails.
// =============================================================================

import type { Segment } from '@/lib/gmb/segment'

export interface VerticalVocab {
  /** "Destaka Saúde", "Destaka Pet", etc. */
  brandLabel: string
  /** "pacientes", "tutores", "clientes" */
  clientes: string
  /** "paciente", "tutor", "cliente" */
  cliente: string
  /** "consultório", "clínica", "escritório", "estabelecimento" */
  local: string
  /** "consulta", "atendimento" */
  atendimento: string
  /** "profissional de saúde", "profissional", "colega" */
  profissional: string
  /** "Quantos pacientes...", "Quantos tutores..." */
  volumeLabel: string
  /** Tagline: "Você cuida dos seus pacientes..." */
  tagline: { title: string; subtitle: string }
  /** Footer de email */
  emailFooter: string
}

const SAUDE: VerticalVocab = {
  brandLabel: 'Saúde',
  clientes: 'pacientes',
  cliente: 'paciente',
  local: 'consultório',
  atendimento: 'consulta',
  profissional: 'profissional de saúde',
  volumeLabel: 'Quantos pacientes você atende por semana?',
  tagline: {
    title: 'Você cuida de atender seus pacientes.',
    subtitle: 'Nós cuidamos de fazer novos pacientes chegar até você.',
  },
  emailFooter: 'Você cuida dos seus pacientes. O Destaka Saúde cuida de trazer os próximos.',
}

const PET: VerticalVocab = {
  brandLabel: 'Pet',
  clientes: 'tutores',
  cliente: 'tutor',
  local: 'clínica',
  atendimento: 'atendimento',
  profissional: 'profissional pet',
  volumeLabel: 'Quantos tutores você atende por semana?',
  tagline: {
    title: 'Você cuida dos pets.',
    subtitle: 'Nós cuidamos de trazer novos tutores até você.',
  },
  emailFooter: 'Você cuida dos pets. O Destaka Pet cuida de trazer novos tutores.',
}

const JURIDICO: VerticalVocab = {
  brandLabel: 'Jurídico',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'escritório',
  atendimento: 'atendimento',
  profissional: 'advogado',
  volumeLabel: 'Quantos clientes você atende por semana?',
  tagline: {
    title: 'Você cuida dos seus clientes.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida dos seus clientes. O Destaka Jurídico cuida de trazer os próximos.',
}

const CONTABIL: VerticalVocab = {
  brandLabel: 'Contábil',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'escritório',
  atendimento: 'atendimento',
  profissional: 'contador',
  volumeLabel: 'Quantos clientes você atende por semana?',
  tagline: {
    title: 'Você cuida da contabilidade dos seus clientes.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida dos números. O Destaka Contábil cuida da sua visibilidade.',
}

const IMOVEIS: VerticalVocab = {
  brandLabel: 'Imóveis',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'imobiliária',
  atendimento: 'atendimento',
  profissional: 'corretor',
  volumeLabel: 'Quantos clientes você atende por semana?',
  tagline: {
    title: 'Você cuida de encontrar o imóvel certo.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida dos imóveis. O Destaka Imóveis cuida da sua visibilidade.',
}

const BELEZA: VerticalVocab = {
  brandLabel: 'Beleza',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'salão',
  atendimento: 'atendimento',
  profissional: 'profissional de beleza',
  volumeLabel: 'Quantos clientes você atende por semana?',
  tagline: {
    title: 'Você cuida da beleza dos seus clientes.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida da beleza. O Destaka Beleza cuida da sua visibilidade.',
}

const FITNESS: VerticalVocab = {
  brandLabel: 'Fitness',
  clientes: 'alunos',
  cliente: 'aluno',
  local: 'academia',
  atendimento: 'treino',
  profissional: 'profissional fitness',
  volumeLabel: 'Quantos alunos você atende por semana?',
  tagline: {
    title: 'Você cuida do treino dos seus alunos.',
    subtitle: 'Nós cuidamos de trazer novos alunos até você.',
  },
  emailFooter: 'Você cuida dos treinos. O Destaka Fitness cuida da sua visibilidade.',
}

const RESTAURANTE: VerticalVocab = {
  brandLabel: 'Food',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'restaurante',
  atendimento: 'atendimento',
  profissional: 'profissional de gastronomia',
  volumeLabel: 'Quantos clientes você atende por semana?',
  tagline: {
    title: 'Você cuida da comida.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida da comida. O Destaka Food cuida da sua visibilidade.',
}

const AUTOMOTIVO: VerticalVocab = {
  brandLabel: 'Auto',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'oficina',
  atendimento: 'atendimento',
  profissional: 'profissional automotivo',
  volumeLabel: 'Quantos clientes você atende por semana?',
  tagline: {
    title: 'Você cuida dos carros.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida dos carros. O Destaka Auto cuida da sua visibilidade.',
}

const DEFAULT: VerticalVocab = {
  brandLabel: '',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'estabelecimento',
  atendimento: 'atendimento',
  profissional: 'profissional',
  volumeLabel: 'Quantos clientes você atende por semana?',
  tagline: {
    title: 'Você cuida do seu negócio.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida do seu negócio. O Destaka cuida da sua visibilidade.',
}

const SEGMENT_MAP: Record<string, VerticalVocab> = {
  'dentista': SAUDE,
  'médico': SAUDE,
  'psicólogo': SAUDE,
  'psiquiatra': SAUDE,
  'fisioterapeuta': SAUDE,
  'profissional de saúde': SAUDE,
  'advogado': JURIDICO,
  'veterinário': PET,
  'contador': CONTABIL,
  'imobiliária': IMOVEIS,
  'beleza': BELEZA,
  'fitness': FITNESS,
  'restaurante': RESTAURANTE,
  'automotivo': AUTOMOTIVO,
}

/**
 * Retorna o vocabulário personalizado para um segmento/specialty.
 * Aceita tanto Segment (de detectSegment) quanto specialty (do banco).
 */
export function getVocab(specialty: string | null | undefined): VerticalVocab {
  if (!specialty) return DEFAULT
  return SEGMENT_MAP[specialty] ?? DEFAULT
}

/**
 * Retorna o label da marca: "Destaka Saúde", "Destaka Pet", etc.
 * Se não tem vertical específica, retorna apenas "Destaka".
 */
export function getBrandName(specialty: string | null | undefined): string {
  const vocab = getVocab(specialty)
  return vocab.brandLabel ? `Destaka ${vocab.brandLabel}` : 'Destaka'
}
