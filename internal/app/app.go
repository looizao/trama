package app

import (
	"context"
	"crypto/rand"
	"crypto/tls"
	"database/sql"
	_ "embed"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go.temporal.io/sdk/client"
	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schema string

type App struct {
	DB              *sql.DB
	Storage         *Storage
	Temporal        client.Client
	ImageAPIBaseURL string
	ImageAPIKey     string
	ImageModel      string
}

func Open(ctx context.Context) (*App, error) {
	db, err := OpenDatabase(ctx, os.Getenv("DATABASE_PATH"))
	if err != nil {
		return nil, err
	}
	store, err := OpenStorage(ctx, db)
	if err != nil {
		db.Close()
		return nil, err
	}
	a := &App{
		DB: db, Storage: store,
		ImageAPIBaseURL: strings.TrimSuffix(os.Getenv("IMAGE_API_BASE_URL"), "/"),
		ImageAPIKey:     os.Getenv("IMAGE_API_KEY"),
		ImageModel:      os.Getenv("IMAGE_MODEL"),
	}
	if err := a.bootstrapAdmin(ctx); err != nil {
		db.Close()
		return nil, err
	}
	return a, nil
}

func OpenDatabase(ctx context.Context, path string) (*sql.DB, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return nil, errors.New("DATABASE_PATH is required")
	}
	if path != ":memory:" {
		absolute, err := filepath.Abs(path)
		if err != nil {
			return nil, err
		}
		path = absolute
		if err = os.MkdirAll(filepath.Dir(path), 0700); err != nil {
			return nil, err
		}
	}
	query := url.Values{}
	query.Add("_pragma", "busy_timeout(5000)")
	query.Add("_pragma", "foreign_keys(1)")
	query.Add("_pragma", "journal_mode(WAL)")
	query.Add("_pragma", "synchronous(NORMAL)")
	dsn := "file:" + filepath.ToSlash(path) + "?" + query.Encode()
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	if err = db.PingContext(ctx); err != nil {
		db.Close()
		return nil, err
	}
	for _, statement := range strings.Split(schema, ";") {
		if strings.TrimSpace(statement) == "" {
			continue
		}
		if _, err = db.ExecContext(ctx, statement); err != nil {
			db.Close()
			return nil, fmt.Errorf("schema: %w", err)
		}
	}
	if path != ":memory:" {
		if err = os.Chmod(path, 0600); err != nil {
			db.Close()
			return nil, err
		}
	}
	return db, nil
}

func (a *App) ConnectTemporal() error {
	address := os.Getenv("TEMPORAL_ADDRESS")
	if address == "" {
		return errors.New("TEMPORAL_ADDRESS is required")
	}
	namespace := os.Getenv("TEMPORAL_NAMESPACE")
	if namespace == "" {
		namespace = "default"
	}
	options := client.Options{HostPort: address, Namespace: namespace}
	if key := os.Getenv("TEMPORAL_API_KEY"); key != "" {
		options.ConnectionOptions = client.ConnectionOptions{TLS: &tls.Config{MinVersion: tls.VersionTLS12}}
		options.Credentials = client.NewAPIKeyStaticCredentials(key)
	}
	c, err := client.Dial(options)
	if err != nil {
		return err
	}
	a.Temporal = c
	return nil
}

func (a *App) Close() {
	if a.Temporal != nil {
		a.Temporal.Close()
	}
	if a.Storage != nil {
		a.Storage.Close()
	}
	if a.DB != nil {
		a.DB.Close()
	}
}

func (a *App) bootstrapAdmin(ctx context.Context) error {
	var count int
	if err := a.DB.QueryRowContext(ctx, "SELECT count(*) FROM users").Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	email := strings.ToLower(strings.TrimSpace(os.Getenv("ADMIN_EMAIL")))
	password := os.Getenv("ADMIN_PASSWORD")
	if email == "" || password == "" {
		return errors.New("ADMIN_EMAIL and ADMIN_PASSWORD are required for the first launch")
	}
	if len(password) < 12 {
		return errors.New("ADMIN_PASSWORD must have at least 12 characters")
	}
	hash, err := hashPassword(password)
	if err != nil {
		return err
	}
	tx, err := a.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	orgID, userID := newID(), newID()
	if _, err = tx.ExecContext(ctx, "INSERT INTO organizations (id,name) VALUES ($1,$2)", orgID, "My studio"); err != nil {
		return err
	}
	if _, err = tx.ExecContext(ctx, "INSERT INTO users (id,organization_id,email,name,password_hash,role) VALUES ($1,$2,$3,$4,$5,'admin')", userID, orgID, email, "Administrator", hash); err != nil {
		return err
	}
	if err = tx.Commit(); err != nil {
		return err
	}
	log.Printf("initial administrator created: %s", email)
	return nil
}

func newID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	s := hex.EncodeToString(b)
	return s[:8] + "-" + s[8:12] + "-" + s[12:16] + "-" + s[16:20] + "-" + s[20:]
}

func isID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i, c := range s {
		if i == 8 || i == 13 || i == 18 || i == 23 {
			if c != '-' {
				return false
			}
			continue
		}
		if !strings.ContainsRune("0123456789abcdefABCDEF", c) {
			return false
		}
	}
	return true
}

func now() time.Time { return time.Now().UTC() }
