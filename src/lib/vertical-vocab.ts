// =============================================================================
// DESTAKA — Vocabulário por vertical
// Fonte canônica de termos personalizados por nicho.
// Usado em: dashboard, diagnóstico, onboarding, emails, engines de IA.
// =============================================================================

export interface VerticalVocab {
  /** Label interno da vertical (usado apenas para lógica, nunca exibido ao usuário) */
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
  /** Exemplos de serviços para o onboarding, ex: ["Ex: Arranjos florais", "Ex: Entrega"] */
  servicePlaceholders: string[]
  /** Mensagens WhatsApp para o Kit Reviews (3 mensagens por vertical) */
  whatsappMessages: { label: string; text: string }[]
  /** Contexto de compliance para engines de IA (CFM para saúde, OAB para jurídico, null para genérico) */
  complianceContext: string | null
  /** Palavras-chave e temas para geração de posts */
  postKeywords: string
  /** Tipo do Google Places para descoberta de concorrentes */
  placesSearchType: string
  /** Palavra-chave de busca para descoberta de concorrentes */
  placesSearchKeyword: string
  /** Frase de contexto para o engine de auditoria */
  auditContext: string
  /** Texto da página de avaliação: "Sua avaliação ajuda outros {clientes} a encontrar..." */
  reviewPageCopy: string
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
  servicePlaceholders: ['Ex: Consulta clínica geral', 'Ex: Exames e diagnósticos', 'Ex: Procedimento especializado'],
  whatsappMessages: [
    {
      label: 'Pós-consulta simples',
      text: 'Olá! Obrigado por confiar no nosso atendimento. Se você ficou satisfeito, sua avaliação no Google nos ajuda a alcançar mais pacientes que precisam de cuidado. Leva menos de 1 minuto: {link}',
    },
    {
      label: 'Pós-consulta com agradecimento',
      text: 'Olá! Foi um prazer atender você hoje. Avaliações honestas ajudam outras pessoas a encontrar um profissional de saúde de confiança. Se quiser compartilhar sua experiência, aqui está o link: {link}',
    },
    {
      label: 'Lembrete gentil',
      text: 'Oi! Passando para lembrar que sua avaliação faz diferença para nossos próximos pacientes. Se puder dedicar um minutinho, ficamos muito gratos: {link}',
    },
  ],
  complianceContext:
    'Respeite as normas do CFM (Conselho Federal de Medicina), CRO (Conselho Regional de Odontologia) e COFFITO. Não faça promessas de resultado. Não use termos como "o melhor" ou "garantido". Não mostre imagens de antes e depois de procedimentos.',
  postKeywords: 'saúde, bem-estar, prevenção, qualidade de vida, cuidado, consulta, diagnóstico, tratamento',
  placesSearchType: 'health',
  placesSearchKeyword: 'clínica médica',
  auditContext: 'perfil de profissional de saúde no Google Business Profile, focado em atrair pacientes locais',
  reviewPageCopy: 'Sua avaliação ajuda outros pacientes a encontrar um profissional de saúde de confiança.',
}

const PET: VerticalVocab = {
  brandLabel: 'Pet',
  clientes: 'tutores',
  cliente: 'tutor',
  local: 'clínica',
  atendimento: 'atendimento',
  profissional: 'veterinário',
  volumeLabel: 'Quantos animais você atende por semana?',
  tagline: {
    title: 'Você cuida dos pets.',
    subtitle: 'Nós cuidamos de trazer novos tutores até você.',
  },
  emailFooter: 'Você cuida dos pets. O Destaka Pet cuida de trazer novos tutores.',
  servicePlaceholders: ['Ex: Consulta veterinária', 'Ex: Banho e tosa', 'Ex: Vacinas e vermifugação'],
  whatsappMessages: [
    {
      label: 'Pós-atendimento',
      text: 'Olá! Esperamos que o pet esteja bem após o atendimento. Se você ficou satisfeito com o cuidado que recebeu, sua avaliação no Google nos ajuda muito a ajudar mais pets. Leva só 1 minuto: {link}',
    },
    {
      label: 'Agradecimento ao tutor',
      text: 'Oi! Obrigado por confiar em nós com o cuidado do seu pet. Uma avaliação sua faz toda a diferença para outros tutores que estão procurando um lugar de confiança: {link}',
    },
    {
      label: 'Lembrete amigável',
      text: 'Oi! Passando para saber se está tudo bem com o bichinho. Aproveite e deixe sua avaliação, ela ajuda muitos outros tutores: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'pets, animais de estimação, saúde animal, cuidados veterinários, vacinas, banho e tosa, bem-estar animal',
  placesSearchType: 'veterinary_care',
  placesSearchKeyword: 'clínica veterinária',
  auditContext: 'clínica veterinária ou pet shop no Google Business Profile, focado em atrair tutores locais',
  reviewPageCopy: 'Sua avaliação ajuda outros tutores a encontrar um lugar de confiança para cuidar dos seus pets.',
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
  servicePlaceholders: ['Ex: Direito trabalhista', 'Ex: Direito de família', 'Ex: Consultoria jurídica'],
  whatsappMessages: [
    {
      label: 'Pós-consulta jurídica',
      text: 'Olá! Obrigado por nos procurar. Se o atendimento foi útil, uma avaliação no Google nos ajuda a alcançar outras pessoas que precisam de orientação jurídica: {link}',
    },
    {
      label: 'Encerramento de caso',
      text: 'Oi! Ficamos felizes em ter te ajudado. Sua experiência pode fazer diferença para outros clientes que estão buscando suporte jurídico de confiança. Se quiser compartilhar: {link}',
    },
    {
      label: 'Lembrete discreto',
      text: 'Olá! Sua avaliação honesta no Google ajuda nosso escritório a ser encontrado por quem realmente precisa de ajuda. Leva menos de 1 minuto: {link}',
    },
  ],
  complianceContext:
    'Respeite as normas da OAB (Ordem dos Advogados do Brasil). Não faça captação de clientela de forma vedada. Não prometa resultados em processos. Não use termos sensacionalistas ou comparativos como "o melhor advogado".',
  postKeywords: 'direito, advocacia, orientação jurídica, proteção legal, seus direitos, legislação, consultoria jurídica',
  placesSearchType: 'lawyer',
  placesSearchKeyword: 'escritório de advocacia',
  auditContext: 'escritório de advocacia no Google Business Profile, focado em atrair clientes que buscam orientação jurídica',
  reviewPageCopy: 'Sua avaliação ajuda outros clientes a encontrar um suporte jurídico de confiança.',
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
  servicePlaceholders: ['Ex: Abertura de empresa', 'Ex: Declaração de imposto de renda', 'Ex: Folha de pagamento'],
  whatsappMessages: [
    {
      label: 'Pós-serviço contábil',
      text: 'Olá! Obrigado por confiar em nós com a contabilidade do seu negócio. Uma avaliação sua no Google nos ajuda a ser encontrados por mais empreendedores: {link}',
    },
    {
      label: 'Declaração entregue',
      text: 'Oi! Sua declaração foi entregue com sucesso. Se o serviço foi bom, nos ajude a chegar em mais clientes com uma avaliação rápida: {link}',
    },
    {
      label: 'Lembrete de avaliação',
      text: 'Olá! Sua opinião sobre nosso trabalho faz diferença para quem está buscando um contador de confiança. Se puder avaliar, agradecemos muito: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'contabilidade, gestão financeira, imposto de renda, abertura de empresa, planejamento tributário, folha de pagamento, MEI, CNPJ',
  placesSearchType: 'accounting',
  placesSearchKeyword: 'escritório de contabilidade',
  auditContext: 'escritório de contabilidade no Google Business Profile, focado em atrair empresas e empreendedores locais',
  reviewPageCopy: 'Sua avaliação ajuda outros empreendedores a encontrar um contador de confiança.',
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
  servicePlaceholders: ['Ex: Venda de imóveis residenciais', 'Ex: Locação de imóveis comerciais', 'Ex: Avaliação de imóveis'],
  whatsappMessages: [
    {
      label: 'Pós-fechamento de negócio',
      text: 'Olá! Foi um prazer te ajudar a encontrar o imóvel certo. Se a experiência foi positiva, sua avaliação no Google ajuda outras pessoas a nos encontrar na hora que mais precisam: {link}',
    },
    {
      label: 'Pós-visita ao imóvel',
      text: 'Oi! Obrigado por nos acompanhar na visita. Se gostou do atendimento, deixe uma avaliação, ela nos ajuda muito: {link}',
    },
    {
      label: 'Lembrete pós-negócio',
      text: 'Olá! Esperamos que esteja feliz com o novo imóvel. Uma avaliação sua faz toda a diferença para quem está procurando um corretor de confiança: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'imóveis, compra e venda, locação, apartamento, casa, investimento imobiliário, corretor, financiamento',
  placesSearchType: 'real_estate_agency',
  placesSearchKeyword: 'imobiliária',
  auditContext: 'imobiliária ou corretor de imóveis no Google Business Profile, focado em atrair compradores e locatários locais',
  reviewPageCopy: 'Sua avaliação ajuda outros clientes a encontrar um corretor de confiança na região.',
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
  servicePlaceholders: ['Ex: Corte de cabelo feminino', 'Ex: Coloração e luzes', 'Ex: Manicure e pedicure'],
  whatsappMessages: [
    {
      label: 'Pós-serviço de beleza',
      text: 'Olá! Esperamos que tenha amado o resultado. Se ficou satisfeita, sua avaliação no Google nos ajuda a alcançar mais clientes que buscam um salão de confiança: {link}',
    },
    {
      label: 'Agradecimento pela visita',
      text: 'Oi! Foi ótimo receber você hoje. Adoraríamos saber o que achou do serviço. Se quiser compartilhar sua experiência: {link}',
    },
    {
      label: 'Lembrete amigável',
      text: 'Oi! Sua avaliação nos ajuda muito a crescer e a atender ainda melhor. Se puder avaliar, leva menos de 1 minuto: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'beleza, cabelo, unhas, estética, salão, cuidados pessoais, autoestima, transformação, coloração, manicure',
  placesSearchType: 'beauty_salon',
  placesSearchKeyword: 'salão de beleza',
  auditContext: 'salão de beleza ou estética no Google Business Profile, focado em atrair clientes locais',
  reviewPageCopy: 'Sua avaliação ajuda outros clientes a encontrar um salão de confiança na região.',
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
  servicePlaceholders: ['Ex: Musculação e hipertrofia', 'Ex: Aulas de grupo (spinning, funcional)', 'Ex: Personal trainer'],
  whatsappMessages: [
    {
      label: 'Pós-treino',
      text: 'Oi! Espero que o treino tenha sido ótimo. Se está gostando da academia, sua avaliação no Google ajuda novos alunos a nos encontrar: {link}',
    },
    {
      label: 'Mês de treino completado',
      text: 'Parabéns pelo mês de dedicação! Se a experiência está sendo boa, conta para outros alunos em potencial com uma avaliação rápida: {link}',
    },
    {
      label: 'Lembrete para alunos ativos',
      text: 'Oi! Você já é parte da nossa turma há um tempo. Sua opinião faz diferença. Se puder avaliar a academia, agradecemos muito: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'academia, fitness, musculação, treino, saúde, bem-estar, emagrecimento, hipertrofia, personal trainer, qualidade de vida',
  placesSearchType: 'gym',
  placesSearchKeyword: 'academia de ginástica',
  auditContext: 'academia ou estúdio fitness no Google Business Profile, focado em atrair novos alunos locais',
  reviewPageCopy: 'Sua avaliação ajuda outros alunos a encontrar uma academia de confiança perto deles.',
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
  servicePlaceholders: ['Ex: Almoço executivo', 'Ex: Delivery', 'Ex: Jantar especial e eventos'],
  whatsappMessages: [
    {
      label: 'Pós-refeição',
      text: 'Olá! Esperamos que tenha curtido a refeição. Se a experiência foi boa, uma avaliação no Google nos ajuda muito a receber novos clientes: {link}',
    },
    {
      label: 'Pós-delivery',
      text: 'Oi! Seu pedido chegou! Esperamos que esteja tudo delicioso. Se quiser compartilhar a experiência: {link}',
    },
    {
      label: 'Lembrete de cliente frequente',
      text: 'Oi! Obrigado por ser um cliente fiel. Sua avaliação faz diferença para quem está procurando um bom restaurante perto daqui: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'gastronomia, restaurante, comida, delivery, almoço, jantar, culinária, prato do dia, cardápio, sabor',
  placesSearchType: 'restaurant',
  placesSearchKeyword: 'restaurante',
  auditContext: 'restaurante ou estabelecimento de alimentação no Google Business Profile, focado em atrair clientes locais e delivery',
  reviewPageCopy: 'Sua avaliação ajuda outros clientes a descobrir nosso restaurante.',
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
  servicePlaceholders: ['Ex: Revisão preventiva', 'Ex: Funilaria e pintura', 'Ex: Troca de óleo e filtros'],
  whatsappMessages: [
    {
      label: 'Pós-serviço automotivo',
      text: 'Olá! Seu carro está pronto. Esperamos que tudo tenha ficado como esperado. Se ficou satisfeito com o serviço, sua avaliação no Google nos ajuda muito: {link}',
    },
    {
      label: 'Pós-revisão',
      text: 'Oi! Revisão concluída. Se o atendimento foi bom, conta pra outros motoristas da região com uma avaliação rápida: {link}',
    },
    {
      label: 'Lembrete de cliente',
      text: 'Olá! Você confiou o seu carro a nós, isso significa muito. Se puder deixar uma avaliação, ajuda outros motoristas a nos encontrar: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'oficina mecânica, revisão, carro, manutenção automotiva, funilaria, pintura, pneus, freios, troca de óleo',
  placesSearchType: 'car_repair',
  placesSearchKeyword: 'oficina mecânica',
  auditContext: 'oficina mecânica ou auto center no Google Business Profile, focado em atrair motoristas locais',
  reviewPageCopy: 'Sua avaliação ajuda outros motoristas a encontrar uma oficina de confiança na região.',
}

const FLORES: VerticalVocab = {
  brandLabel: 'Flores',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'floricultura',
  atendimento: 'atendimento',
  profissional: 'florista',
  volumeLabel: 'Quantos pedidos você entrega por semana?',
  tagline: {
    title: 'Você cuida de cada arranjo com carinho.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida das flores. O Destaka Flores cuida da sua visibilidade.',
  servicePlaceholders: ['Ex: Arranjos florais para eventos', 'Ex: Buquês e presentes', 'Ex: Entrega de flores'],
  whatsappMessages: [
    {
      label: 'Pós-entrega de arranjo',
      text: 'Olá! Esperamos que o arranjo tenha encantado quem recebeu. Se ficou satisfeito, sua avaliação no Google nos ajuda a levar flores a mais pessoas: {link}',
    },
    {
      label: 'Pós-evento floral',
      text: 'Oi! Foi um prazer decorar seu evento com nossas flores. Uma avaliação sua faz toda a diferença para novos clientes: {link}',
    },
    {
      label: 'Lembrete para clientes frequentes',
      text: 'Oi! Obrigado por sempre confiar em nós. Sua avaliação ajuda outras pessoas a descobrir nossa floricultura: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'flores, arranjos florais, buquês, decoração floral, presente, entrega de flores, evento, casamento, aniversário',
  placesSearchType: 'florist',
  placesSearchKeyword: 'floricultura',
  auditContext: 'floricultura ou florista no Google Business Profile, focado em atrair clientes que buscam arranjos e presentes florais',
  reviewPageCopy: 'Sua avaliação ajuda outros clientes a encontrar uma floricultura de confiança.',
}

const MARKETING: VerticalVocab = {
  brandLabel: 'Marketing',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'agência',
  atendimento: 'projeto',
  profissional: 'profissional de marketing',
  volumeLabel: 'Quantos clientes você atende por mês?',
  tagline: {
    title: 'Você cuida do crescimento dos seus clientes.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida do marketing. O Destaka Marketing cuida da sua visibilidade.',
  servicePlaceholders: ['Ex: Gestão de redes sociais', 'Ex: Tráfego pago (Google Ads, Meta Ads)', 'Ex: Identidade visual e branding'],
  whatsappMessages: [
    {
      label: 'Pós-entrega de projeto',
      text: 'Olá! Obrigado pela parceria. Se o resultado do projeto te agradou, uma avaliação no Google nos ajuda a alcançar mais empresas que precisam crescer: {link}',
    },
    {
      label: 'Fim de contrato mensal',
      text: 'Oi! Chegamos ao fim de mais um mês de trabalho. Se você está satisfeito com os resultados, compartilhe sua experiência aqui: {link}',
    },
    {
      label: 'Lembrete para clientes ativos',
      text: 'Olá! Sua avaliação honesta nos ajuda a conquistar novos clientes. Se puder dedicar 1 minuto, agradecemos muito: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'marketing digital, tráfego pago, redes sociais, branding, SEO, gestão de marketing, resultados, crescimento, estratégia digital',
  placesSearchType: 'marketing_agency',
  placesSearchKeyword: 'agência de marketing digital',
  auditContext: 'agência de marketing ou consultoria no Google Business Profile, focado em atrair empresas que buscam crescimento digital',
  reviewPageCopy: 'Sua avaliação ajuda outras empresas a encontrar uma agência de confiança.',
}

const FOTOGRAFIA: VerticalVocab = {
  brandLabel: 'Foto',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'estúdio',
  atendimento: 'sessão',
  profissional: 'fotógrafo',
  volumeLabel: 'Quantas sessões você realiza por semana?',
  tagline: {
    title: 'Você cuida de capturar os melhores momentos.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida das fotos. O Destaka Foto cuida da sua visibilidade.',
  servicePlaceholders: ['Ex: Ensaio fotográfico', 'Ex: Fotografia de casamento', 'Ex: Fotografia corporativa'],
  whatsappMessages: [
    {
      label: 'Pós-entrega das fotos',
      text: 'Olá! Suas fotos estão prontas. Esperamos que tenha amado cada uma. Se ficou feliz com o resultado, sua avaliação no Google nos ajuda muito: {link}',
    },
    {
      label: 'Pós-sessão de fotos',
      text: 'Oi! Foi um prazer fotografar você. Se gostou da experiência, compartilhe com outras pessoas que buscam um fotógrafo de confiança: {link}',
    },
    {
      label: 'Lembrete de avaliação',
      text: 'Olá! Uma avaliação sua faz toda a diferença para novos clientes que nos encontram no Google. Leva menos de 1 minuto: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'fotografia, ensaio, retrato, casamento, evento, fotógrafo, estúdio fotográfico, imagem, captura de momentos',
  placesSearchType: 'photographer',
  placesSearchKeyword: 'fotógrafo',
  auditContext: 'fotógrafo ou estúdio fotográfico no Google Business Profile, focado em atrair clientes para ensaios e eventos',
  reviewPageCopy: 'Sua avaliação ajuda outros clientes a encontrar um fotógrafo de confiança.',
}

const EDUCACAO: VerticalVocab = {
  brandLabel: 'Educação',
  clientes: 'alunos',
  cliente: 'aluno',
  local: 'escola',
  atendimento: 'aula',
  profissional: 'educador',
  volumeLabel: 'Quantos alunos você atende por semana?',
  tagline: {
    title: 'Você cuida do aprendizado dos seus alunos.',
    subtitle: 'Nós cuidamos de trazer novos alunos até você.',
  },
  emailFooter: 'Você cuida do ensino. O Destaka Educação cuida da sua visibilidade.',
  servicePlaceholders: ['Ex: Curso preparatório para vestibular', 'Ex: Aulas particulares de matemática', 'Ex: Curso de idiomas'],
  whatsappMessages: [
    {
      label: 'Pós-aula ou módulo',
      text: 'Olá! Obrigado por estudar conosco. Se a experiência de aprendizado foi boa, sua avaliação no Google ajuda outros alunos a nos encontrar: {link}',
    },
    {
      label: 'Fim de curso',
      text: 'Parabéns pela conclusão do curso! Sua jornada de aprendizado nos enche de orgulho. Se quiser compartilhar como foi, estamos aqui: {link}',
    },
    {
      label: 'Lembrete para alunos',
      text: 'Oi! Uma avaliação sua ajuda outros alunos a encontrar um lugar de qualidade para estudar. Leva só 1 minuto: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'educação, ensino, curso, aulas, aprendizado, vestibular, idiomas, habilidades, formação, conhecimento',
  placesSearchType: 'school',
  placesSearchKeyword: 'escola ou curso',
  auditContext: 'escola ou centro de ensino no Google Business Profile, focado em atrair alunos e pais locais',
  reviewPageCopy: 'Sua avaliação ajuda outros alunos e pais a encontrar uma escola de qualidade.',
}

const TECNOLOGIA: VerticalVocab = {
  brandLabel: 'Tech',
  clientes: 'clientes',
  cliente: 'cliente',
  local: 'empresa',
  atendimento: 'projeto',
  profissional: 'profissional de tecnologia',
  volumeLabel: 'Quantos clientes você atende por mês?',
  tagline: {
    title: 'Você cuida da tecnologia do seu cliente.',
    subtitle: 'Nós cuidamos de trazer novos clientes até você.',
  },
  emailFooter: 'Você cuida da tecnologia. O Destaka Tech cuida da sua visibilidade.',
  servicePlaceholders: ['Ex: Desenvolvimento de software', 'Ex: Suporte e manutenção de TI', 'Ex: Consultoria em transformação digital'],
  whatsappMessages: [
    {
      label: 'Pós-entrega de projeto tech',
      text: 'Olá! O projeto foi entregue. Esperamos que tudo esteja funcionando perfeitamente. Se ficou satisfeito, sua avaliação no Google nos ajuda a crescer: {link}',
    },
    {
      label: 'Fim de contrato de suporte',
      text: 'Oi! Chegamos ao fim de mais um período de parceria. Se nosso suporte fez diferença para o seu negócio, compartilhe aqui: {link}',
    },
    {
      label: 'Lembrete para clientes',
      text: 'Olá! Uma avaliação sua ajuda outras empresas a nos encontrar quando precisam de suporte em tecnologia. Leva menos de 1 minuto: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'tecnologia, software, TI, transformação digital, desenvolvimento, inovação, suporte técnico, automação, sistemas',
  placesSearchType: 'software_company',
  placesSearchKeyword: 'empresa de tecnologia',
  auditContext: 'empresa de tecnologia ou consultoria de TI no Google Business Profile, focado em atrair empresas que buscam soluções digitais',
  reviewPageCopy: 'Sua avaliação ajuda outras empresas a encontrar um parceiro de tecnologia de confiança.',
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
  servicePlaceholders: ['Ex: Meu principal serviço', 'Ex: Segundo serviço', 'Ex: Terceiro serviço'],
  whatsappMessages: [
    {
      label: 'Pós-atendimento',
      text: 'Olá! Obrigado por escolher nosso negócio. Se você ficou satisfeito, sua avaliação no Google nos ajuda muito a crescer. Leva menos de 1 minuto: {link}',
    },
    {
      label: 'Agradecimento',
      text: 'Oi! Foi um prazer te atender. Uma avaliação sua faz toda a diferença para outros clientes que estão nos procurando: {link}',
    },
    {
      label: 'Lembrete',
      text: 'Olá! Sua avaliação honesta ajuda outras pessoas a nos encontrar e confiar no nosso trabalho. Se puder avaliar, agradecemos: {link}',
    },
  ],
  complianceContext: null,
  postKeywords: 'negócio local, serviços, qualidade, atendimento, clientes, profissional',
  placesSearchType: 'establishment',
  placesSearchKeyword: 'negócio local',
  auditContext: 'negócio local no Google Business Profile, focado em atrair clientes da região',
  reviewPageCopy: 'Sua avaliação ajuda outras pessoas a nos encontrar e confiar no nosso trabalho.',
}

// =============================================================================
// MAPA DE SEGMENTOS
// =============================================================================

const SEGMENT_MAP: Record<string, VerticalVocab> = {
  // Saúde
  dentista: SAUDE,
  médico: SAUDE,
  psicólogo: SAUDE,
  psiquiatra: SAUDE,
  fisioterapeuta: SAUDE,
  nutricionista: SAUDE,
  'profissional de saúde': SAUDE,
  // Jurídico
  advogado: JURIDICO,
  // Pet
  veterinário: PET,
  // Contabilidade
  contador: CONTABIL,
  // Imóveis
  imobiliária: IMOVEIS,
  // Beleza
  beleza: BELEZA,
  // Fitness
  fitness: FITNESS,
  // Alimentação
  restaurante: RESTAURANTE,
  // Automotivo
  automotivo: AUTOMOTIVO,
  // Flores
  floricultura: FLORES,
  florista: FLORES,
  // Marketing e consultoria
  marketing: MARKETING,
  consultoria: MARKETING,
  agência: MARKETING,
  // Fotografia
  fotógrafo: FOTOGRAFIA,
  'estúdio fotográfico': FOTOGRAFIA,
  fotografia: FOTOGRAFIA,
  // Educação
  educação: EDUCACAO,
  escola: EDUCACAO,
  // Tecnologia
  tecnologia: TECNOLOGIA,
  // Genérico
  'negócio local': DEFAULT,
}

// =============================================================================
// FUNÇÕES PÚBLICAS
// =============================================================================

/**
 * Retorna o vocabulário personalizado para um segmento/specialty.
 * Aceita tanto Segment (de detectSegment) quanto specialty (do banco).
 */
export function getVocab(specialty: string | null | undefined): VerticalVocab {
  if (!specialty) return DEFAULT
  return SEGMENT_MAP[specialty] ?? DEFAULT
}

/**
 * Retorna sempre "Destaka". Sem sub-marcas.
 */
export function getBrandName(specialty: string | null | undefined): string {
  return 'Destaka'
}

// =============================================================================
// ENGINE CONTEXT — Contrato para engines de IA (posts, audit, optimizer)
// =============================================================================

export interface EngineContext {
  vocab: VerticalVocab
  brandName: string
  /** "especialista em SEO local para {vertical} no Brasil" */
  systemPromptRole: string
  /** Regras de compliance (CFM, OAB) ou null para verticais sem regulação */
  complianceRules: string | null
  /** Palavras-chave para geração de posts */
  postKeywords: string
  /** Tipo do Google Places para busca de concorrentes */
  placesSearchType: string
  /** Palavra-chave de busca para concorrentes */
  placesSearchKeyword: string
}

/**
 * Retorna o contexto completo para engines de IA, derivado do vocabulário da vertical.
 * Use esta função em vez de getVocab() diretamente nos engines de posts, auditoria e otimização.
 */
export function getEngineContext(specialty: string | null | undefined): EngineContext {
  const vocab = getVocab(specialty)
  return {
    vocab,
    brandName: getBrandName(specialty),
    systemPromptRole: `especialista em Google Business Profile e SEO local para negócios no Brasil, com foco em ${vocab.auditContext}`,
    complianceRules: vocab.complianceContext,
    postKeywords: vocab.postKeywords,
    placesSearchType: vocab.placesSearchType,
    placesSearchKeyword: vocab.placesSearchKeyword,
  }
}
