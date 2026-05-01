-- Adiciona snapshot dos dados reais do perfil GBP salvos no momento do diagnóstico.
-- Permite que os fluxos de otimização usem os dados reais em vez de mock.
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS profile_snapshot jsonb;
