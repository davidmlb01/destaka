# PRD — GMM: Google Meu Negócio Manager
**Versão:** 1.0
**Data:** 2026-03-28
**Status:** Aprovado para Desenvolvimento
**PM:** Morgan (@pm)

---

## 1. Visão & Problema

### Visão
GMM é uma plataforma SaaS que automatiza a otimização do Google Business Profile (Google Meu Negócio) para profissionais liberais brasileiros — dentistas, médicos, advogados, psicólogos e outros.

### Problema Central
Profissionais liberais perdem clientes todos os dias porque seu perfil no Google está incompleto, desatualizado ou mal configurado. A maioria não tem tempo para aprender, e agências cobram R$250–800/mês por um trabalho manual e não escalável.

**Dados que validam a dor:**
- 51% dos negócios têm perfis não reivindicados no Google
- Perfis completos têm 7x mais chances de aparecer nos resultados
- Cada avaliação adicional = 80 visitas extras + 63 rotas + 16 ligações
- Perfis com fotos geram 17% mais receita por visitante
- Postar semanalmente aumenta impressões locais em 26%

### Por que agora
- No Brasil, não existe nenhum SaaS self-service automatizado nesse nicho
- O modelo foi validado globalmente pelo Paige (Merchynt, $99/mês, 10k+ perfis)
- Agências manuais são o único concorrente local — inescaláveis e caras
- Claude API permite diagnóstico e geração de conteúdo em português nativo

---

## 2. Usuário-Alvo

### Persona Primária: Dentista / Médico
- Fatura R$30k–200k/mês
- Não tem equipe de marketing
- Sabe que o Google importa, mas não sabe o que fazer
- Pagaria R$150–200/mês se a ferramenta "fizer sozinha"
- Decisão de compra baseada em ROI imediato (1 paciente novo = assinatura paga)

### Persona Secundária: Agência de Marketing Local
- Gerencia 10–50 clientes
- Precisa de uma ferramenta para automatizar o trabalho manual
- Modelo white-label ideal

### Segmentos prioritários (em ordem):
1. Dentistas
2. Médicos (clínicos gerais, especialistas)
3. Psicólogos / Terapeutas
4. Advogados
5. Fisioterapeutas

---

## 3. Funcionalidades — MVP (V1)

### FR-001: Onboarding & Conexão Google
- Login com Google OAuth 2.0
- Seleção do perfil GMB (usuário pode ter múltiplos)
- Leitura completa do perfil via Google Business Profile API
- Armazenamento seguro dos tokens de acesso

### FR-002: Diagnóstico & Score
- Score geral 0–100 calculado automaticamente
- Score por categoria: Informações Básicas, Fotos, Avaliações, Posts, Serviços, Atributos
- Comparação com benchmark por segmento (dentista vs. médico vs. advogado)
- Relatório de diagnóstico em português com linguagem acessível
- Insights gerados por Claude com contexto específico do segmento

### FR-003: Otimização Automática (o que a API permite)
- Completar/corrigir horários de funcionamento
- Adicionar/corrigir categorias primária e secundárias
- Adicionar atributos relevantes por segmento
- Publicar posts automáticos semanais (gerados por Claude)
- Sugerir e postar respostas a avaliações
- Adicionar descrição otimizada do negócio
- Adicionar serviços com descrição

### FR-004: Checklist Guiado (o que depende do usuário)
- Lista priorizada de ações manuais necessárias
- Instruções passo-a-passo em português
- Upload de fotos guiado (com orientação sobre o que fotografar)
- Notificações por e-mail das pendências
- Marcação de conclusão pelo usuário

### FR-005: Dashboard de Monitoramento
- Visualização do score ao longo do tempo
- Métricas da API: cliques, ligações, rotas, views
- Histórico de ações executadas
- Alertas de oportunidade (avaliação sem resposta, posts em atraso)
- Relatório mensal em PDF

### FR-006: Gestão de Avaliações
- Listagem de todas as avaliações (respondidas e não respondidas)
- Geração de resposta automática via Claude (contexto do segmento)
- Aprovação/edição antes de publicar (ou publicação direta em modo automático)
- Alertas para avaliações negativas

---

## 4. Funcionalidades — V2 (Pós-MVP)

- Multi-perfil (agências): gerenciar N clientes numa dashboard
- White label completo para agências
- Integração com WhatsApp para coletar avaliações proativamente
- Análise de concorrentes locais
- Sugestão de keywords locais por segmento
- Relatórios para clientes (modo agência)
- API pública para integrações

---

## 5. Requisitos Não-Funcionais

### NFR-001: Performance
- Diagnóstico inicial: < 30 segundos
- Dashboard load: < 2 segundos
- Score atualizado a cada 24h automaticamente

### NFR-002: Segurança
- OAuth 2.0 com refresh tokens armazenados criptografados
- Zero armazenamento de senha do Google
- LGPD compliance — dados dos clientes só no Brasil (Supabase BR region)
- Rate limiting nas APIs

### NFR-003: Confiabilidade
- Uptime: 99.5%+
- Retry automático em falhas de API
- Fallback gracioso se Google API indisponível

### NFR-004: Escalabilidade
- Suportar 1.000 perfis no MVP
- Arquitetura preparada para 10.000+ perfis

---

## 6. Estratégia de Monetização

| Plano | Valor | Inclui |
|-------|-------|--------|
| Setup Único | R$497 | Setup completo + 1 mês de monitoramento |
| Essencial (mensal) | R$147/mês | 1 perfil, monitoramento, posts automáticos |
| Pro (mensal) | R$197/mês | 1 perfil + respostas automáticas + relatório PDF |
| Agência | R$497–997/mês | 10–50 perfis, white label |
| Anual Pro | R$1.497/ano | Equivale a ~R$125/mês (desconto 37%) |

**Meta de receita:**
- 100 clientes × R$197 = R$19.700 MRR
- 500 clientes × R$197 = R$98.500 MRR

---

## 7. Métricas de Sucesso (V1)

- 50 usuários pagantes em 60 dias do lançamento
- Score médio dos perfis gerenciados: +30 pontos em 30 dias
- Churn mensal: < 5%
- NPS: > 50
- CAC payback: < 3 meses

---

## 8. Integrações Externas

| Serviço | Uso | Custo estimado |
|---------|-----|----------------|
| Google Business Profile API | Core — leitura e escrita | Gratuito |
| Google OAuth 2.0 | Autenticação | Gratuito |
| Claude API (Anthropic) | Diagnóstico, geração de conteúdo | ~$0.01–0.05/usuário/mês |
| Stripe | Pagamentos e assinaturas | 3.99% por transação |
| Supabase | Banco de dados + Auth | $25/mês (Pro) |
| Resend | E-mails transacionais | $20/mês |
| Vercel | Deploy frontend | $20/mês (Pro) |

---

## 9. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Google restringir API | Baixa | Alto | Seguir quotas rigorosamente, nunca automatizar sem consentimento |
| Google mudar política de uso | Média | Alto | Monitorar Google Business Profile API changelog |
| Baixa conversão no onboarding | Média | Médio | Onboarding guiado, vídeo de 2min, suporte via WhatsApp |
| Custo de API escalar | Baixa | Médio | Cache agressivo, leitura batch |

---

## 10. Fora de Escopo (V1)

- Integração com outras plataformas (Yelp, Apple Maps, etc.)
- App mobile nativo
- CRM próprio
- Gestão de anúncios Google Ads
- Análise de SEO geral (só GMB)
