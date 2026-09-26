CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'professional')),
  active integer NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash blob PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage_objects (
  key text PRIMARY KEY,
  content_type text NOT NULL,
  data blob NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS clients_org_created_idx ON clients (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS milestones (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (client_id, position)
);

CREATE TABLE IF NOT EXISTS generation_runs (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_asset_id text,
  prompt text NOT NULL,
  model_id text NOT NULL,
  provider_request_id text NOT NULL DEFAULT '',
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 4),
  status text NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  error text NOT NULL DEFAULT '',
  created_by text NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamp
);
CREATE INDEX IF NOT EXISTS generation_runs_client_idx ON generation_runs (organization_id, client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS assets (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  run_id text REFERENCES generation_runs(id) ON DELETE SET NULL,
  milestone_id text REFERENCES milestones(id) ON DELETE SET NULL,
  source_asset_id text REFERENCES assets(id) ON DELETE SET NULL,
  storage_key text NOT NULL UNIQUE,
  content_type text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('source', 'generated')),
  variant_index integer,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS assets_client_idx ON assets (organization_id, client_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS assets_run_variant_idx ON assets (run_id, variant_index) WHERE run_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  actor_id text REFERENCES users(id),
  action text NOT NULL,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
