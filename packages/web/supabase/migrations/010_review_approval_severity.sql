-- Review approval severity system
-- Reviews com rating <= 3 ou menção a procedimentos requerem aprovação antes de publicar resposta

-- Adicionar campo reply_status se não existir
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gmb_reviews' AND column_name = 'reply_status'
  ) THEN
    ALTER TABLE gmb_reviews ADD COLUMN reply_status text DEFAULT 'pending';
  END IF;
END $$;

-- Adicionar campo ai_reply_draft para rascunhos pendentes de aprovação
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gmb_reviews' AND column_name = 'ai_reply_draft'
  ) THEN
    ALTER TABLE gmb_reviews ADD COLUMN ai_reply_draft text;
  END IF;
END $$;

-- Índice para filtrar pendentes de aprovação
CREATE INDEX IF NOT EXISTS idx_gmb_reviews_reply_status ON gmb_reviews(reply_status);
CREATE INDEX IF NOT EXISTS idx_gmb_reviews_pending ON gmb_reviews(profile_id, reply_status) WHERE reply_status = 'pending_approval';
