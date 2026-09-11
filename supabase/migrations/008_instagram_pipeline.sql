-- =============================================================================
-- DESTAKA — Migration 008: Instagram-to-GBP Content Pipeline
-- Puxa posts do Instagram via scraping, reescreve com keywords SEO, publica no GBP
-- Spec: docs/destaka/spec-instagram-to-gbp-pipeline.md
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Campo instagram_handle na tabela organizations
-- ---------------------------------------------------------------------------
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

COMMENT ON COLUMN organizations.instagram_handle IS
  'Handle do Instagram do profissional/clinica (ex: @clinicadental). Usado pelo pipeline de scraping para puxar posts.';

-- ---------------------------------------------------------------------------
-- TABELA: instagram_posts
-- Posts extraidos do Instagram, reescritos com keywords e publicados no GBP
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  instagram_post_id   TEXT NOT NULL,
  instagram_shortcode TEXT,
  image_url           TEXT NOT NULL,
  original_caption    TEXT,
  rewritten_caption   TEXT,
  keywords_injected   TEXT[],
  source              TEXT NOT NULL DEFAULT 'scraping' CHECK (source IN ('scraping', 'graph_api')),
  status              TEXT NOT NULL DEFAULT 'scraped' CHECK (status IN ('scraped', 'rewriting', 'ready', 'published', 'failed', 'skipped')),
  skip_reason         TEXT,
  engagement_score    INTEGER DEFAULT 0,
  published_to_gbp_at TIMESTAMPTZ,
  gbp_post_id         TEXT,
  scraped_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, instagram_post_id)
);

COMMENT ON TABLE public.instagram_posts IS
  'Posts do Instagram do profissional, reescritos com keywords SEO e publicados no GBP. Pipeline: scraped > rewriting > ready > published.';

-- ---------------------------------------------------------------------------
-- INDICES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_instagram_posts_org_id
  ON public.instagram_posts(organization_id);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_status
  ON public.instagram_posts(status);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_org_status
  ON public.instagram_posts(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_scraped_at
  ON public.instagram_posts(scraped_at DESC);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Mesmo padrao do projeto: isolamento por organization via professionals
-- ---------------------------------------------------------------------------
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instagram_posts_org_isolation" ON public.instagram_posts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM professionals
      WHERE user_id = auth.uid()
    )
  );
