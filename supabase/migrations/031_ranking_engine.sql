-- Motor de Ranking: keyword tracking + position history
-- Objetivo: rastrear posicao do usuario para cada keyword de busca local

-- Keywords de ranking derivadas dos services do onboarding + nome do negocio
CREATE TABLE IF NOT EXISTS public.ranking_keywords (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  source text NOT NULL DEFAULT 'auto', -- 'auto' (inferido), 'manual' (adicionado pelo usuario)
  is_primary boolean NOT NULL DEFAULT false, -- keyword principal (ex: "quiropraxia copacabana")
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, keyword)
);

-- Historico de posicao para cada keyword (snapshot semanal)
CREATE TABLE IF NOT EXISTS public.ranking_positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id uuid NOT NULL REFERENCES public.ranking_keywords(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position integer, -- 1 = primeiro, null = nao apareceu nos top 20
  total_results integer, -- quantos resultados a busca retornou
  top_competitor_name text, -- quem esta em primeiro
  top_competitor_reviews integer, -- reviews do primeiro colocado
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(keyword_id, snapshot_date)
);

-- Indices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_ranking_keywords_org ON public.ranking_keywords(organization_id);
CREATE INDEX IF NOT EXISTS idx_ranking_positions_keyword ON public.ranking_positions(keyword_id);
CREATE INDEX IF NOT EXISTS idx_ranking_positions_org_date ON public.ranking_positions(organization_id, snapshot_date DESC);

-- RLS
ALTER TABLE public.ranking_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ranking keywords" ON public.ranking_keywords
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own ranking positions" ON public.ranking_positions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.professionals WHERE user_id = auth.uid()
    )
  );
