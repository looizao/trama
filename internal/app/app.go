package app

import (
	"context"
	"crypto/rand"
	_ "embed"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.temporal.io/sdk/client"
)

//go:embed schema.sql
var schema string

type App struct {
	DB       *pgxpool.Pool
	Storage  *Storage
	Temporal client.Client
	FalKey   string
}

func Open(ctx context.Context) (*App, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return nil, errors.New("DATABASE_URL is required")
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	for _, statement := range strings.Split(schema, ";") {
		if strings.TrimSpace(statement) == "" {
			continue
		}
		if _, err = pool.Exec(ctx, statement); err != nil {
			pool.Close()
			return nil, fmt.Errorf("schema: %w", err)
		}
	}
	store, err := OpenStorage(ctx, pool)
	if err != nil {
		pool.Close()
		return nil, err
	}
	a := &App{DB: pool, Storage: store, FalKey: os.Getenv("FAL_KEY")}
	if err := a.bootstrapAdmin(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return a, nil
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
	if a.DB != nil {
		a.DB.Close()
	}
}

func (a *App) bootstrapAdmin(ctx context.Context) error {
	var count int
	if err := a.DB.QueryRow(ctx, "SELECT count(*) FROM users").Scan(&count); err != nil {
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
	tx, err := a.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	orgID, userID := newID(), newID()
	if _, err = tx.Exec(ctx, "INSERT INTO organizations (id,name) VALUES ($1,$2)", orgID, "My studio"); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, "INSERT INTO users (id,organization_id,email,name,password_hash,role) VALUES ($1,$2,$3,$4,$5,'admin')", userID, orgID, email, "Administrator", hash); err != nil {
		return err
	}
	if err = tx.Commit(ctx); err != nil {
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
