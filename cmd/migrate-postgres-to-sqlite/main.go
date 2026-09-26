package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/looizao/trama/internal/app"
)

type tableSpec struct {
	name    string
	columns []string
	order   string
}

var tables = []tableSpec{
	{name: "organizations", columns: []string{"id", "name", "created_at"}, order: "created_at, id"},
	{name: "users", columns: []string{"id", "organization_id", "email", "name", "password_hash", "role", "active", "created_at"}, order: "created_at, id"},
	{name: "sessions", columns: []string{"token_hash", "user_id", "expires_at", "created_at"}, order: "created_at, user_id"},
	{name: "clients", columns: []string{"id", "organization_id", "name", "email", "notes", "created_at", "updated_at"}, order: "created_at, id"},
	{name: "milestones", columns: []string{"id", "organization_id", "client_id", "title", "position", "created_at"}, order: "client_id, position, id"},
	{name: "generation_runs", columns: []string{"id", "organization_id", "client_id", "source_asset_id", "prompt", "model_id", "provider_request_id", "quantity", "status", "error", "created_by", "created_at", "completed_at"}, order: "created_at, id"},
	{name: "assets", columns: []string{"id", "organization_id", "client_id", "run_id", "milestone_id", "source_asset_id", "storage_key", "content_type", "kind", "variant_index", "created_at"}, order: "CASE kind WHEN 'source' THEN 0 ELSE 1 END, created_at, id"},
	{name: "audit_events", columns: []string{"id", "organization_id", "actor_id", "action", "subject_type", "subject_id", "created_at"}, order: "created_at, id"},
}

func main() {
	ctx := context.Background()
	sourceURL := strings.TrimSpace(os.Getenv("SOURCE_DATABASE_URL"))
	destinationPath := strings.TrimSpace(os.Getenv("DATABASE_PATH"))
	if sourceURL == "" || destinationPath == "" {
		log.Fatal("SOURCE_DATABASE_URL and DATABASE_PATH are required")
	}

	source, err := sql.Open("pgx", sourceURL)
	if err != nil {
		log.Fatal(err)
	}
	defer source.Close()
	if err = source.PingContext(ctx); err != nil {
		log.Fatalf("connect to PostgreSQL: %v", err)
	}

	destination, err := app.OpenDatabase(ctx, destinationPath)
	if err != nil {
		log.Fatal(err)
	}
	defer destination.Close()
	if err = requireEmpty(ctx, destination); err != nil {
		log.Fatal(err)
	}

	store, err := app.OpenStorage(ctx, destination)
	if err != nil {
		log.Fatal(err)
	}
	objects, err := copyStorage(ctx, source, store)
	if err != nil {
		log.Fatalf("copy storage objects: %v", err)
	}
	log.Printf("storage_objects: copied and verified %d", objects)

	tx, err := destination.BeginTx(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()
	for _, table := range tables {
		count, copyErr := copyTable(ctx, source, tx, table)
		if copyErr != nil {
			log.Fatalf("copy %s: %v", table.name, copyErr)
		}
		log.Printf("%s: copied %d", table.name, count)
	}
	if err = tx.Commit(); err != nil {
		log.Fatal(err)
	}
	committed = true

	if err = verifyCounts(ctx, source, destination, objects); err != nil {
		log.Fatal(err)
	}
	if err = verifyForeignKeys(ctx, destination); err != nil {
		log.Fatal(err)
	}
	log.Print("migration completed and verified")
}

func requireEmpty(ctx context.Context, destination *sql.DB) error {
	for _, table := range tables {
		count, err := rowCount(ctx, destination, table.name)
		if err != nil {
			return err
		}
		if count != 0 {
			return fmt.Errorf("destination table %s is not empty", table.name)
		}
	}
	count, err := rowCount(ctx, destination, "storage_objects")
	if err != nil {
		return err
	}
	if count != 0 {
		return errors.New("destination storage_objects table is not empty")
	}
	return nil
}

func copyTable(ctx context.Context, source *sql.DB, destination *sql.Tx, table tableSpec) (int, error) {
	columns := strings.Join(table.columns, ",")
	rows, err := source.QueryContext(ctx, "SELECT "+columns+" FROM "+table.name+" ORDER BY "+table.order)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	parameters := make([]string, len(table.columns))
	for i := range parameters {
		parameters[i] = fmt.Sprintf("$%d", i+1)
	}
	insert := "INSERT INTO " + table.name + "(" + columns + ") VALUES(" + strings.Join(parameters, ",") + ")"
	count := 0
	for rows.Next() {
		values := make([]any, len(table.columns))
		targets := make([]any, len(values))
		for i := range values {
			targets[i] = &values[i]
		}
		if err = rows.Scan(targets...); err != nil {
			return count, err
		}
		if _, err = destination.ExecContext(ctx, insert, values...); err != nil {
			return count, err
		}
		count++
	}
	return count, rows.Err()
}

func copyStorage(ctx context.Context, source *sql.DB, destination *app.Storage) (int, error) {
	rows, err := source.QueryContext(ctx, "SELECT key,content_type,data FROM storage_objects ORDER BY key")
	if err != nil {
		return 0, err
	}
	defer rows.Close()
	count := 0
	for rows.Next() {
		var key, contentType string
		var data []byte
		if err = rows.Scan(&key, &contentType, &data); err != nil {
			return count, err
		}
		if err = destination.Put(ctx, key, contentType, bytes.NewReader(data)); err != nil {
			return count, err
		}
		body, getErr := destination.Get(ctx, key)
		if getErr != nil {
			return count, getErr
		}
		hash := sha256.New()
		_, copyErr := io.Copy(hash, body)
		closeErr := body.Close()
		if copyErr != nil {
			return count, copyErr
		}
		if closeErr != nil {
			return count, closeErr
		}
		want := sha256.Sum256(data)
		if !bytes.Equal(hash.Sum(nil), want[:]) {
			return count, fmt.Errorf("checksum mismatch for %s: got %s want %s", key, hex.EncodeToString(hash.Sum(nil)), hex.EncodeToString(want[:]))
		}
		count++
	}
	return count, rows.Err()
}

func verifyCounts(ctx context.Context, source, destination *sql.DB, objects int) error {
	for _, table := range tables {
		want, err := rowCount(ctx, source, table.name)
		if err != nil {
			return err
		}
		got, err := rowCount(ctx, destination, table.name)
		if err != nil {
			return err
		}
		if got != want {
			return fmt.Errorf("row count mismatch for %s: got %d want %d", table.name, got, want)
		}
	}
	want, err := rowCount(ctx, source, "storage_objects")
	if err != nil {
		return err
	}
	if objects != want {
		return fmt.Errorf("storage object count mismatch: got %d want %d", objects, want)
	}
	return nil
}

func verifyForeignKeys(ctx context.Context, destination *sql.DB) error {
	rows, err := destination.QueryContext(ctx, "PRAGMA foreign_key_check")
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		var table string
		var rowID int64
		var parent string
		var constraint int
		if err = rows.Scan(&table, &rowID, &parent, &constraint); err != nil {
			return err
		}
		return fmt.Errorf("foreign key violation in %s row %d referencing %s", table, rowID, parent)
	}
	return rows.Err()
}

func rowCount(ctx context.Context, db interface {
	QueryRowContext(context.Context, string, ...any) *sql.Row
}, table string) (int, error) {
	var count int
	err := db.QueryRowContext(ctx, "SELECT count(*) FROM "+table).Scan(&count)
	return count, err
}
