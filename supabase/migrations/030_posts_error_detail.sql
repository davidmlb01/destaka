-- Migration 030: Adiciona error_detail em posts para distinguir 'failed' de 'pending'
ALTER TABLE posts ADD COLUMN IF NOT EXISTS error_detail text;

COMMENT ON COLUMN posts.error_detail IS 'Detalhe do erro quando status = failed (ex: Zernio e GBP v4 indisponiveis)';
