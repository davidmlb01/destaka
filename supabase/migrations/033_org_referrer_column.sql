-- Adiciona coluna referrer para rastrear origem organica de visitantes
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS referrer text;

COMMENT ON COLUMN organizations.referrer IS 'Hostname do referrer capturado no proxy (ex: google.com)';
