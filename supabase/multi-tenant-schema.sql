-- RodStack Multi-Tenant Schema
-- Run in Supabase SQL Editor after enabling uuid-ossp extension

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_slug VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_email VARCHAR(255) NOT NULL,
  subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  subscription_id VARCHAR(255),
  customer_id VARCHAR(255),
  owner_name VARCHAR(255),
  owner_email VARCHAR(255),

  logo_url VARCHAR(500),
  brand_color_primary VARCHAR(7),
  brand_color_accent VARCHAR(7),
  custom_domain VARCHAR(255),

  deployment_url VARCHAR(500),
  deployment_status VARCHAR(20) DEFAULT 'pending',
  deployment_error TEXT,
  deployed_at TIMESTAMP,

  is_white_glove BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,

  api_calls_this_month INT DEFAULT 0,
  last_active_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_tier CHECK (subscription_tier IN ('free', 'builder', 'pro', 'business', 'enterprise'))
);

CREATE TABLE IF NOT EXISTS feature_flags (
  tier VARCHAR(20) PRIMARY KEY,
  max_ai_queries_per_month INT,
  max_saved_builds INT,
  has_pdf_export BOOLEAN,
  has_component_calculator BOOLEAN,
  has_customer_management BOOLEAN,
  has_branded_quotes BOOLEAN,
  has_pricing_dashboard BOOLEAN,
  has_inventory_tracking BOOLEAN,
  has_analytics BOOLEAN,
  has_bundled_export BOOLEAN,
  max_team_seats INT,
  has_role_based_permissions BOOLEAN,
  has_multi_location BOOLEAN,
  has_white_label BOOLEAN,
  support_level VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS client_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'builder',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, user_email)
);

CREATE TABLE IF NOT EXISTS client_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  action VARCHAR(100),
  actor_email VARCHAR(255),
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255),
  amount_cents INT,
  currency VARCHAR(3),
  period_start DATE,
  period_end DATE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO feature_flags (
  tier, max_ai_queries_per_month, max_saved_builds, has_pdf_export,
  has_component_calculator, has_customer_management, has_branded_quotes,
  has_pricing_dashboard, has_inventory_tracking, has_analytics,
  has_bundled_export, max_team_seats, has_role_based_permissions,
  has_multi_location, has_white_label, support_level
) VALUES
  ('free', 20, 3, false, false, false, false, false, false, false, false, 1, false, false, false, 'community'),
  ('builder', NULL, NULL, true, true, false, false, false, false, false, false, 1, false, false, false, 'email'),
  ('pro', NULL, NULL, true, true, true, true, true, false, false, false, 1, false, false, false, 'email'),
  ('business', NULL, NULL, true, true, true, true, true, true, true, true, 3, false, false, false, 'priority'),
  ('enterprise', NULL, NULL, true, true, true, true, true, true, true, true, NULL, true, true, true, 'dedicated')
ON CONFLICT (tier) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(client_slug);
CREATE INDEX IF NOT EXISTS idx_clients_tier ON clients(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(subscription_status);
CREATE INDEX IF NOT EXISTS idx_team_client ON client_team_members(client_id);
CREATE INDEX IF NOT EXISTS idx_usage_client ON api_usage_logs(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_client ON client_activity_log(client_id, created_at);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Helper: extract tenant_id from JWT app_metadata
CREATE OR REPLACE FUNCTION public.jwt_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::UUID;
$$;

-- Clients: users see only their tenant; service role bypasses RLS
CREATE POLICY clients_tenant_select ON clients
  FOR SELECT
  USING (
    id = jwt_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
  );

CREATE POLICY clients_tenant_update ON clients
  FOR UPDATE
  USING (
    id = jwt_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
  );

CREATE POLICY clients_service_insert ON clients
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

-- Team members: scoped to tenant
CREATE POLICY team_members_tenant_select ON client_team_members
  FOR SELECT
  USING (
    client_id = jwt_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
  );

CREATE POLICY team_members_tenant_insert ON client_team_members
  FOR INSERT
  WITH CHECK (
    client_id = jwt_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
  );

CREATE POLICY team_members_tenant_delete ON client_team_members
  FOR DELETE
  USING (
    client_id = jwt_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
  );

-- Activity log: tenant-scoped read; insert via service or tenant members
CREATE POLICY activity_log_tenant_select ON client_activity_log
  FOR SELECT
  USING (
    client_id = jwt_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
  );

CREATE POLICY activity_log_tenant_insert ON client_activity_log
  FOR INSERT
  WITH CHECK (
    client_id = jwt_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
  );

-- API usage logs
CREATE POLICY api_usage_tenant_select ON api_usage_logs
  FOR SELECT
  USING (
    client_id = jwt_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
  );

CREATE POLICY api_usage_tenant_insert ON api_usage_logs
  FOR INSERT
  WITH CHECK (
    client_id = jwt_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Invoices
CREATE POLICY invoices_tenant_select ON invoices
  FOR SELECT
  USING (
    client_id = jwt_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
  );

CREATE POLICY invoices_service_insert ON invoices
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Auto-update updated_at on clients
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
