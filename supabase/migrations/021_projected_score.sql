-- Migration 021: Adiciona coluna projected_score na tabela scores
-- Story DESTAKA-004-01: Score rebalanceado com projecao de melhoria

ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS projected_score integer DEFAULT 0;

COMMENT ON COLUMN scores.projected_score IS 'Score projetado com gaps que Destaka resolve automaticamente';
