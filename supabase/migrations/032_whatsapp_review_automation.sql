-- Migration 032: WhatsApp Review Automation
-- Modulo de pedido automatico de avaliacao via WhatsApp
-- 6 tabelas: connections, contacts, events, requests, dedup, settings
-- Nenhuma tabela armazena texto de mensagem (LGPD)

-- ============================================================
-- TABELA: whatsapp_connections
-- Conexao do WhatsApp de cada organizacao
-- ============================================================
CREATE TABLE public.whatsapp_connections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stub',
  provider_account_ref text,
  phone_number_id text,
  display_phone text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'shadow', 'active', 'disconnected')),
  last_event_at timestamptz,
  connected_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

CREATE INDEX idx_wa_connections_org ON public.whatsapp_connections(organization_id);
CREATE INDEX idx_wa_connections_status ON public.whatsapp_connections(status);

CREATE TRIGGER set_updated_at_wa_connections
  BEFORE UPDATE ON public.whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TABELA: patient_contacts
-- Paciente como contato da organizacao
-- phone_e164 cifrado em repouso, phone_hash para busca
-- ============================================================
CREATE TABLE public.patient_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  phone_e164 text NOT NULL,
  phone_hash text NOT NULL,
  display_name text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz,
  opted_out_at timestamptz,
  opted_out_source text CHECK (opted_out_source IN ('keyword', 'button', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, phone_hash)
);

CREATE INDEX idx_patient_contacts_org ON public.patient_contacts(organization_id);
CREATE INDEX idx_patient_contacts_phone_hash ON public.patient_contacts(organization_id, phone_hash);

CREATE TRIGGER set_updated_at_patient_contacts
  BEFORE UPDATE ON public.patient_contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TABELA: appointment_events
-- Evento de agenda extraido de uma mensagem
-- ============================================================
CREATE TABLE public.appointment_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.patient_contacts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('scheduled', 'rescheduled', 'cancelled')),
  appointment_date date NOT NULL,
  appointment_time time,
  confidence numeric(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  detected_at timestamptz NOT NULL DEFAULT now(),
  superseded_by uuid REFERENCES public.appointment_events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointment_events_org ON public.appointment_events(organization_id);
CREATE INDEX idx_appointment_events_contact ON public.appointment_events(contact_id);
CREATE INDEX idx_appointment_events_date ON public.appointment_events(organization_id, appointment_date);

-- ============================================================
-- TABELA: review_requests
-- Pedido de avaliacao enviado via WhatsApp
-- ============================================================
CREATE TABLE public.review_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.patient_contacts(id) ON DELETE CASCADE,
  appointment_event_id uuid UNIQUE REFERENCES public.appointment_events(id) ON DELETE SET NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'skipped', 'sent', 'delivered', 'read', 'failed')),
  skip_reason text
    CHECK (skip_reason IS NULL OR skip_reason IN (
      'cancelled', 'interval', 'opted_out', 'cap', 'disconnected', 'shadow'
    )),
  provider_message_id text,
  template_name text,
  template_category text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  clicked_at timestamptz,
  cost_estimate_brl numeric(8,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_requests_org ON public.review_requests(organization_id);
CREATE INDEX idx_review_requests_contact ON public.review_requests(contact_id);
CREATE INDEX idx_review_requests_scheduled ON public.review_requests(organization_id, scheduled_for)
  WHERE status = 'scheduled';
CREATE INDEX idx_review_requests_status ON public.review_requests(organization_id, status);

CREATE TRIGGER set_updated_at_review_requests
  BEFORE UPDATE ON public.review_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TABELA: wa_message_dedup
-- Idempotencia de webhooks; limpar apos 7 dias
-- ============================================================
CREATE TABLE public.wa_message_dedup (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message_id_hash text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, message_id_hash)
);

-- ============================================================
-- TABELA: review_settings
-- Configuracao por organizacao
-- ============================================================
CREATE TABLE public.review_settings (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  send_delay_days integer NOT NULL DEFAULT 1,
  min_interval_days integer NOT NULL DEFAULT 180,
  monthly_cap integer NOT NULL DEFAULT 150,
  send_window_start time NOT NULL DEFAULT '09:00',
  send_window_end time NOT NULL DEFAULT '18:00',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  confidence_threshold numeric(3,2) NOT NULL DEFAULT 0.85,
  google_review_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_review_settings
  BEFORE UPDATE ON public.review_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS: todas as tabelas com isolamento por organization_id
-- Service role (Inngest functions, webhooks) bypassa RLS
-- Usuarios autenticados so veem dados da propria organizacao
-- ============================================================

ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_message_dedup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_settings ENABLE ROW LEVEL SECURITY;

-- whatsapp_connections
CREATE POLICY "wa_connections_org_member" ON public.whatsapp_connections
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

-- patient_contacts
CREATE POLICY "patient_contacts_org_member" ON public.patient_contacts
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

-- appointment_events
CREATE POLICY "appointment_events_org_member" ON public.appointment_events
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

-- review_requests
CREATE POLICY "review_requests_org_member" ON public.review_requests
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

-- wa_message_dedup: sem acesso para usuarios regulares (apenas service role)
-- Nao precisa de policy, RLS habilitado sem policies = bloqueado

-- review_settings
CREATE POLICY "review_settings_org_member" ON public.review_settings
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
