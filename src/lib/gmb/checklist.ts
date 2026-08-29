// =============================================================================
// DESTAKA — Checklist Guiado
// Story 1.4 — Ações Manuais Guiadas
// =============================================================================

export type Priority = 'P0' | 'P1' | 'P2'

export interface ChecklistItem {
  key: string
  title: string
  description: string
  impact: number        // pontos de score que a ação recupera
  priority: Priority
  category: 'photos' | 'reviews' | 'verification' | 'info'
  steps: string[]
  done?: boolean
  done_at?: string | null
}

// ---------------------------------------------------------------------------
// Definição dos itens do checklist V1
// ---------------------------------------------------------------------------

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: 'logo_photo',
    title: 'Adicionar foto de perfil da clínica',
    description: 'A foto de perfil é a primeira impressão do seu estabelecimento no Google. Use a logo ou uma foto profissional da fachada.',
    impact: 5,
    priority: 'P0',
    category: 'photos',
    steps: [
      'Acesse o Google Meu Negócio no celular ou computador.',
      'Vá em "Fotos" no menu lateral.',
      'Clique em "Adicionar foto" e selecione "Foto do perfil".',
      'Faça upload de uma imagem com boa resolução (mínimo 720x720px).',
      'Aguarde a aprovação do Google (normalmente em até 24h).',
    ],
  },
  {
    key: 'space_photos',
    title: 'Adicionar 5+ fotos do espaço físico',
    description: 'Fotos do interior do consultório aumentam a confiança do paciente. Fotografe a recepção, sala de atendimento e área de espera.',
    impact: 5,
    priority: 'P0',
    category: 'photos',
    steps: [
      'Fotografe em boa iluminação natural ou artificial, sem usar flash direto.',
      'Acesse o Google Meu Negócio e vá em "Fotos".',
      'Selecione "Fotos internas" e faça upload de pelo menos 5 imagens.',
      'Inclua: recepção, sala de atendimento, sala de espera e fachada.',
      'Evite fotos com pessoas sem autorização.',
    ],
  },
  {
    key: 'cover_photo',
    title: 'Adicionar foto de capa personalizada',
    description: 'A foto de capa aparece em destaque no perfil. Use uma imagem horizontal que represente bem o seu estabelecimento.',
    impact: 5,
    priority: 'P1',
    category: 'photos',
    steps: [
      'Prepare uma imagem horizontal (proporção 16:9, mínimo 1080x608px).',
      'Acesse "Fotos" no Google Meu Negócio.',
      'Clique em "Adicionar foto" e selecione "Foto de capa".',
      'Faça upload da imagem e confirme o posicionamento.',
    ],
  },
  {
    key: 'verify_profile',
    title: 'Verificar o perfil no Google',
    description: 'Perfis verificados aparecem com mais destaque e têm mais confiança nos resultados. A verificação é feita por SMS, e-mail ou carta.',
    impact: 10,
    priority: 'P0',
    category: 'verification',
    steps: [
      'No Google Meu Negócio, clique em "Verificar agora" se disponível.',
      'Escolha o método: SMS (mais rápido) ou carta (5 a 14 dias).',
      'Para SMS: insira o código recebido no campo indicado.',
      'Para carta: aguarde a correspondência e insira o código quando chegar.',
      'Após verificação, seu perfil ganha o selo de verificado.',
    ],
  },
  {
    key: 'request_reviews',
    title: 'Pedir avaliações a pacientes recentes',
    description: 'Avaliações são o principal fator de ranking local. Um pedido simples por WhatsApp aumenta muito a taxa de resposta.',
    impact: 10,
    priority: 'P0',
    category: 'reviews',
    steps: [
      'Acesse o Google Meu Negócio e clique em "Receber mais avaliações".',
      'Copie o link gerado (é o link direto para avaliação).',
      'Envie por WhatsApp para pacientes dos últimos 30 dias com mensagem simples: "Olá [nome], ficamos felizes em ter te atendido. Se puder, deixar uma avaliação no Google nos ajuda muito: [link]".',
      'Envie para no mínimo 10 pacientes para começar.',
      'Evite pedir para múltiplos pacientes ao mesmo tempo para não parecer spam.',
    ],
  },
  {
    key: 'reply_reviews',
    title: 'Responder todas as avaliações em aberto',
    description: 'Responder avaliações mostra profissionalismo e melhora o score. Use a aba Avaliações da Destaka para gerar respostas com IA.',
    impact: 5,
    priority: 'P1',
    category: 'reviews',
    steps: [
      'Acesse a aba "Avaliações" na Destaka.',
      'Filtre por "Sem resposta".',
      'Para cada avaliação, clique em "Responder" e depois "Gerar com IA".',
      'Revise a resposta, ajuste se necessário e clique em "Publicar".',
      'Meta: 100% das avaliações respondidas em até 48h.',
    ],
  },
]

// ---------------------------------------------------------------------------
// Gera checklist com progresso mesclado
// ---------------------------------------------------------------------------

export function buildChecklist(
  progress: Array<{ item_key: string; done: boolean; done_at: string | null }>
): ChecklistItem[] {
  const progressMap = new Map(progress.map(p => [p.item_key, p]))

  return CHECKLIST_ITEMS.map(item => {
    const p = progressMap.get(item.key)
    return {
      ...item,
      done: p?.done ?? false,
      done_at: p?.done_at ?? null,
    }
  }).sort((a, b) => {
    // Pendentes primeiro, depois por prioridade
    if (a.done !== b.done) return a.done ? 1 : -1
    const order = { P0: 0, P1: 1, P2: 2 }
    return order[a.priority] - order[b.priority]
  })
}

export function projectedScore(items: ChecklistItem[], currentScore: number): number {
  const pendingImpact = items.filter(i => !i.done).reduce((s, i) => s + i.impact, 0)
  return Math.min(100, currentScore + pendingImpact)
}
