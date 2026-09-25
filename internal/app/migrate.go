package app

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Move existing case content onto its client before the current schema is applied.
func migrateClientWorkspace(ctx context.Context, pool *pgxpool.Pool) error {
	var exists bool
	if err := pool.QueryRow(ctx, "SELECT to_regclass('public.cases') IS NOT NULL").Scan(&exists); err != nil || !exists {
		return err
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	statements := []string{
		`UPDATE clients cl SET notes=concat_ws(E'\n\n', NULLIF(cl.notes,''), (SELECT string_agg(concat_ws(E'\n', c.title, NULLIF(c.description,'')), E'\n\n' ORDER BY c.created_at, c.id) FROM cases c WHERE c.client_id=cl.id)) WHERE EXISTS (SELECT 1 FROM cases c WHERE c.client_id=cl.id)`,
		"ALTER TABLE milestones ADD COLUMN IF NOT EXISTS client_id uuid",
		"ALTER TABLE generation_runs ADD COLUMN IF NOT EXISTS client_id uuid",
		"ALTER TABLE assets ADD COLUMN IF NOT EXISTS client_id uuid",
		"UPDATE milestones m SET client_id=c.client_id FROM cases c WHERE m.case_id=c.id AND m.client_id IS NULL",
		"UPDATE generation_runs r SET client_id=c.client_id FROM cases c WHERE r.case_id=c.id AND r.client_id IS NULL",
		"UPDATE assets a SET client_id=c.client_id FROM cases c WHERE a.case_id=c.id AND a.client_id IS NULL",
		"ALTER TABLE milestones DROP CONSTRAINT IF EXISTS milestones_case_id_position_key",
		`WITH ordered AS (SELECT m.id, row_number() OVER (PARTITION BY m.client_id ORDER BY c.created_at, m.position, m.created_at, m.id) AS position FROM milestones m JOIN cases c ON c.id=m.case_id) UPDATE milestones m SET position=o.position FROM ordered o WHERE m.id=o.id`,
		"ALTER TABLE milestones ALTER COLUMN client_id SET NOT NULL",
		"ALTER TABLE generation_runs ALTER COLUMN client_id SET NOT NULL",
		"ALTER TABLE assets ALTER COLUMN client_id SET NOT NULL",
		"ALTER TABLE milestones DROP COLUMN case_id CASCADE",
		"ALTER TABLE generation_runs DROP COLUMN case_id CASCADE",
		"ALTER TABLE assets DROP COLUMN case_id CASCADE",
		"DROP TABLE cases",
		"ALTER TABLE milestones ADD CONSTRAINT milestones_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE",
		"ALTER TABLE generation_runs ADD CONSTRAINT generation_runs_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE",
		"ALTER TABLE assets ADD CONSTRAINT assets_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE",
		"ALTER TABLE milestones ADD CONSTRAINT milestones_client_id_position_key UNIQUE (client_id, position)",
	}
	for _, statement := range statements {
		if _, err = tx.Exec(ctx, statement); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
