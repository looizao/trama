package app

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/argon2"
)

const sessionCookie = "trama_session"

type User struct {
	ID             string `json:"id"`
	OrganizationID string `json:"organizationId"`
	Email          string `json:"email"`
	Name           string `json:"name"`
	Role           string `json:"role"`
}

type userKey struct{}

func userFrom(r *http.Request) User { return r.Context().Value(userKey{}).(User) }

func hashPassword(password string) (string, error) {
	if len(password) < 12 {
		return "", errors.New("password must have at least 12 characters")
	}
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	digest := argon2.IDKey([]byte(password), salt, 2, 19*1024, 1, 32)
	return "argon2id$" + base64.RawStdEncoding.EncodeToString(salt) + "$" + base64.RawStdEncoding.EncodeToString(digest), nil
}

func verifyPassword(encoded, password string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 3 || parts[0] != "argon2id" {
		return false
	}
	salt, err := base64.RawStdEncoding.DecodeString(parts[1])
	if err != nil || len(salt) != 16 {
		return false
	}
	want, err := base64.RawStdEncoding.DecodeString(parts[2])
	if err != nil || len(want) != 32 {
		return false
	}
	got := argon2.IDKey([]byte(password), salt, 2, 19*1024, 1, 32)
	return subtle.ConstantTimeCompare(got, want) == 1
}

func newSessionToken() (string, []byte, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", nil, err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	hash := sha256.Sum256([]byte(token))
	return token, hash[:], nil
}

func secureCookie() bool {
	return strings.HasPrefix(os.Getenv("PUBLIC_BASE_URL"), "https://") || os.Getenv("RENDER_EXTERNAL_URL") != ""
}

func (a *App) setSession(w http.ResponseWriter, r *http.Request, userID string) error {
	token, digest, err := newSessionToken()
	if err != nil {
		return err
	}
	expires := now().Add(14 * 24 * time.Hour)
	if _, err = a.DB.ExecContext(r.Context(), "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)", digest, userID, expires); err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: token, Path: "/", Expires: expires, MaxAge: 14 * 24 * 3600, HttpOnly: true, Secure: secureCookie(), SameSite: http.SameSiteLaxMode})
	return nil
}

func clearSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, Secure: secureCookie(), SameSite: http.SameSiteLaxMode})
}

func (a *App) authenticated(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(sessionCookie)
		if err != nil {
			problem(w, 401, "sign in required")
			return
		}
		hash := sha256.Sum256([]byte(cookie.Value))
		var u User
		err = a.DB.QueryRowContext(r.Context(), `SELECT u.id,u.organization_id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2 AND u.active=1`, hash[:], now()).Scan(&u.ID, &u.OrganizationID, &u.Email, &u.Name, &u.Role)
		if err != nil {
			clearSession(w)
			problem(w, 401, "session expired")
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), userKey{}, u)))
	}
}

func requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if userFrom(r).Role != "admin" {
			problem(w, 403, "admin access required")
			return
		}
		next(w, r)
	}
}

type attemptCounter struct {
	mu       sync.Mutex
	attempts map[string][]time.Time
}

var loginAttempts = attemptCounter{attempts: map[string][]time.Time{}}

func (c *attemptCounter) allowed(key string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	cutoff := time.Now().Add(-10 * time.Minute)
	recent := c.attempts[key][:0]
	for _, t := range c.attempts[key] {
		if t.After(cutoff) {
			recent = append(recent, t)
		}
	}
	if len(recent) >= 8 {
		c.attempts[key] = recent
		return false
	}
	c.attempts[key] = append(recent, time.Now())
	return true
}

func (a *App) login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &input); err != nil {
		badRequest(w, err)
		return
	}
	email := strings.ToLower(strings.TrimSpace(input.Email))
	if len(email) > 254 || len(input.Password) > 1024 {
		problem(w, 400, "invalid credentials")
		return
	}
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		ip = r.RemoteAddr
	}
	if !loginAttempts.allowed(ip + ":" + email) {
		problem(w, 429, "too many attempts; try again later")
		return
	}
	var id, hash string
	err = a.DB.QueryRowContext(r.Context(), "SELECT id,password_hash FROM users WHERE email=$1 AND active=1", email).Scan(&id, &hash)
	if err != nil || !verifyPassword(hash, input.Password) {
		problem(w, 401, "invalid credentials")
		return
	}
	if err := a.setSession(w, r, id); err != nil {
		problem(w, 500, "could not create session")
		return
	}
	respond(w, 200, map[string]string{"status": "ok"})
}

func (a *App) logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(sessionCookie); err == nil {
		hash := sha256.Sum256([]byte(cookie.Value))
		_, _ = a.DB.ExecContext(r.Context(), "DELETE FROM sessions WHERE token_hash=$1", hash[:])
	}
	clearSession(w)
	respond(w, 200, map[string]string{"status": "ok"})
}

func (a *App) changePassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Current string `json:"current"`
		Next    string `json:"next"`
	}
	if err := decodeJSON(r, &input); err != nil {
		badRequest(w, err)
		return
	}
	u := userFrom(r)
	var stored string
	if err := a.DB.QueryRowContext(r.Context(), "SELECT password_hash FROM users WHERE id=$1", u.ID).Scan(&stored); err != nil {
		problem(w, 500, "could not load account")
		return
	}
	if !verifyPassword(stored, input.Current) {
		problem(w, 401, "current password is incorrect")
		return
	}
	hash, err := hashPassword(input.Next)
	if err != nil {
		badRequest(w, err)
		return
	}
	if _, err = a.DB.ExecContext(r.Context(), "UPDATE users SET password_hash=$1 WHERE id=$2", hash, u.ID); err != nil {
		problem(w, 500, "could not update password")
		return
	}
	_, _ = a.DB.ExecContext(r.Context(), "DELETE FROM sessions WHERE user_id=$1", u.ID)
	clearSession(w)
	respond(w, 200, map[string]string{"status": "password changed; sign in again"})
}
