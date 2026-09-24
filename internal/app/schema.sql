CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'professional')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash bytea PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clients_org_created_idx ON clients (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cases_client_idx ON cases (organization_id, client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, position)
);

CREATE TABLE IF NOT EXISTS generation_runs (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  source_asset_id uuid,
  prompt text NOT NULL,
  model_id text NOT NULL,
  provider_request_id text NOT NULL DEFAULT '',
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 4),
  status text NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  error text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS generation_runs_case_idx ON generation_runs (organization_id, case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  run_id uuid REFERENCES generation_runs(id) ON DELETE SET NULL,
  milestone_id uuid REFERENCES milestones(id) ON DELETE SET NULL,
  source_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  storage_key text NOT NULL UNIQUE,
  content_type text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('source', 'generated')),
  variant_index integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assets_case_idx ON assets (organization_id, case_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS assets_run_variant_idx ON assets (run_id, variant_index) WHERE run_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  subject_type text NOT NULL,
  subject_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
