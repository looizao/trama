package app

import (
	"bytes"
	"context"
	"io"
	"path/filepath"
	"testing"
	"time"
)

func TestSQLiteDatabaseAndStorage(t *testing.T) {
	ctx := context.Background()
	db, err := OpenDatabase(ctx, filepath.Join(t.TempDir(), "trama.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	var foreignKeys int
	if err = db.QueryRowContext(ctx, "PRAGMA foreign_keys").Scan(&foreignKeys); err != nil || foreignKeys != 1 {
		t.Fatalf("foreign keys are not enabled: value=%d err=%v", foreignKeys, err)
	}
	var journalMode string
	if err = db.QueryRowContext(ctx, "PRAGMA journal_mode").Scan(&journalMode); err != nil || journalMode != "wal" {
		t.Fatalf("WAL is not enabled: value=%q err=%v", journalMode, err)
	}

	created := time.Now().UTC().Truncate(time.Microsecond)
	orgID, userID, clientID := newID(), newID(), newID()
	if _, err = db.ExecContext(ctx, "INSERT INTO organizations(id,name,created_at) VALUES($1,$2,$3)", orgID, "Studio", created); err != nil {
		t.Fatal(err)
	}
	if _, err = db.ExecContext(ctx, "INSERT INTO users(id,organization_id,email,name,password_hash,role,created_at) VALUES($1,$2,$3,$4,$5,'admin',$6)", userID, orgID, "admin@example.com", "Admin", "hash", created); err != nil {
		t.Fatal(err)
	}
	if _, err = db.ExecContext(ctx, "INSERT INTO clients(id,organization_id,name,created_at) VALUES($1,$2,$3,$4)", clientID, orgID, "Client", created); err != nil {
		t.Fatal(err)
	}
	var loaded time.Time
	if err = db.QueryRowContext(ctx, "SELECT created_at FROM clients WHERE id=$1", clientID).Scan(&loaded); err != nil {
		t.Fatal(err)
	}
	if !loaded.Equal(created) {
		t.Fatalf("timestamp changed during round trip: got %s want %s", loaded, created)
	}
	if _, err = db.ExecContext(ctx, "INSERT INTO clients(id,organization_id,name) VALUES($1,$2,$3)", newID(), newID(), "Orphan"); err == nil {
		t.Fatal("foreign key violation was accepted")
	}

	store, err := OpenStorage(ctx, db)
	if err != nil {
		t.Fatal(err)
	}
	want := []byte("portrait bytes")
	if err = store.Put(ctx, "org/client/portrait.jpg", "image/jpeg", bytes.NewReader(want)); err != nil {
		t.Fatal(err)
	}
	body, err := store.Get(ctx, "org/client/portrait.jpg")
	if err != nil {
		t.Fatal(err)
	}
	defer body.Close()
	got, err := io.ReadAll(body)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, want) {
		t.Fatalf("stored bytes changed: got %q want %q", got, want)
	}
}
