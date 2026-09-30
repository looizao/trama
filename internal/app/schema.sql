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

CREATE TABLE IF NOT EXISTS client_permissions (
  client_id text PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  notice_version text NOT NULL,
  acknowledged_name text NOT NULL,
  method text NOT NULL,
  acknowledged_at timestamp NOT NULL,
  withdrawn_at timestamp
);
CREATE TABLE IF NOT EXISTS permission_links (
  token_hash blob PRIMARY KEY,
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  expires_at timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS privacy_tombstones (
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  PRIMARY KEY(subject_type, subject_id)
);
CREATE TABLE IF NOT EXISTS media_purges (
  storage_key text PRIMARY KEY,
  error text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS privacy_requests (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  client_id text NOT NULL,
  action text NOT NULL,
  status text NOT NULL,
  requested_at timestamp NOT NULL,
  completed_at timestamp
);

CREATE TABLE IF NOT EXISTS intake_templates (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  questions text NOT NULL,
  archived integer NOT NULL DEFAULT 0 CHECK (archived IN (0,1)),
  updated_at timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS consultations (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  series_id text NOT NULL,
  revision integer NOT NULL,
  title text NOT NULL,
  fields text NOT NULL,
  template_snapshot text NOT NULL,
  answers text NOT NULL,
  created_by text NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL,
  UNIQUE(series_id,revision)
);
CREATE INDEX IF NOT EXISTS consultations_client_idx ON consultations(organization_id,client_id,created_at DESC);

CREATE TABLE IF NOT EXISTS photo_sets (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  consultation_id text REFERENCES consultations(id) ON DELETE SET NULL,
  title text NOT NULL,
  created_at timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS photo_views (
  set_id text NOT NULL REFERENCES photo_sets(id) ON DELETE CASCADE,
  view text NOT NULL CHECK(view IN ('front','left-three-quarter','right-three-quarter','left-profile','right-profile','back','crown','under-chin')),
  asset_id text NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  PRIMARY KEY(set_id,view),
  UNIQUE(set_id,asset_id)
);

CREATE TABLE IF NOT EXISTS demo_jobs (
  run_id text PRIMARY KEY REFERENCES generation_runs(id) ON DELETE CASCADE,
  candidate text NOT NULL,
  kind text NOT NULL,
  photo_set_id text REFERENCES photo_sets(id) ON DELETE SET NULL,
  settings text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  result text NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS demo_job_inputs (
  run_id text NOT NULL REFERENCES generation_runs(id) ON DELETE CASCADE,
  asset_id text NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  view text NOT NULL,
  PRIMARY KEY(run_id,view)
);
CREATE TABLE IF NOT EXISTS demo_job_sources (
  run_id text PRIMARY KEY REFERENCES demo_jobs(run_id) ON DELETE CASCADE,
  source_run_id text NOT NULL REFERENCES demo_jobs(run_id) ON DELETE CASCADE,
  CHECK(run_id <> source_run_id)
);
CREATE INDEX IF NOT EXISTS demo_job_sources_parent_idx ON demo_job_sources(source_run_id);
CREATE TABLE IF NOT EXISTS demo_job_references (
  run_id text PRIMARY KEY REFERENCES demo_jobs(run_id) ON DELETE CASCADE,
  source_run_id text NOT NULL REFERENCES demo_jobs(run_id) ON DELETE CASCADE,
  CHECK(run_id <> source_run_id)
);
CREATE INDEX IF NOT EXISTS demo_job_references_parent_idx ON demo_job_references(source_run_id);
CREATE VIEW IF NOT EXISTS demo_job_dependencies AS
SELECT run_id,source_run_id FROM demo_job_sources
UNION SELECT run_id,source_run_id FROM demo_job_references;
CREATE TABLE IF NOT EXISTS demo_options (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  candidate text NOT NULL,
  title text NOT NULL,
  state text NOT NULL,
  created_at timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS demo_option_inputs (
  option_id text NOT NULL REFERENCES demo_options(id) ON DELETE CASCADE,
  asset_id text NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  PRIMARY KEY(option_id,asset_id)
);
CREATE TABLE IF NOT EXISTS demo_workspace_states (
  client_id text PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  state text NOT NULL,
  version integer NOT NULL DEFAULT 1
);
