-- Migration 013: Enable RLS on core tables
-- organizations, professionals, google_tokens, leads
-- These tables were created outside migrations and lacked RLS policies

-- ============================================================
-- PROFESSIONALS
-- ============================================================
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professionals_own_record" ON public.professionals
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_member_access" ON public.organizations
  FOR ALL
  USING (
    id IN (
      SELECT p.organization_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT p.organization_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================
-- GOOGLE_TOKENS
-- ============================================================
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_tokens_org_member" ON public.google_tokens
  FOR ALL
  USING (
    organization_id IN (
      SELECT p.organization_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================
-- LEADS
-- Leads are public-insert (capture-lead API uses service role)
-- but should not be readable by regular users
-- ============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies = blocked for regular users
-- Service role (used by capture-lead API and admin) bypasses RLS
-- Admin access is through service role client in (admin)/layout.tsx
