-- Drop old restrictive specialty check constraint
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_specialty_check;

-- Add new constraint accepting all segments from detectSegment()
ALTER TABLE organizations ADD CONSTRAINT organizations_specialty_check
  CHECK (specialty IN (
    'dentista',
    'médico',
    'psicólogo',
    'psiquiatra',
    'fisioterapeuta',
    'advogado',
    'veterinário',
    'contador',
    'imobiliária',
    'beleza',
    'fitness',
    'restaurante',
    'automotivo',
    'educação',
    'tecnologia',
    'profissional de saúde',
    'negócio local',
    'nutricionista',
    'outro'
  ));
