package app

import (
	"bufio"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go.temporal.io/api/serviceerror"
	"golang.org/x/sys/unix"
)

// The shared file lock serializes the API and any separate worker process.
func (a *App) lockMedia() (func(), error) {
	a.mediaMu.Lock()
	if a.privacyFault.Load() || a.PrivacyLedgerPath == "" {
		a.mediaMu.Unlock()
		return nil, errors.New("privacy recovery is required")
	}
	if err := os.MkdirAll(filepath.Dir(a.PrivacyLedgerPath), 0700); err != nil {
		a.mediaMu.Unlock()
		return nil, err
	}
	f, err := os.OpenFile(a.PrivacyLedgerPath+".lock", os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		a.mediaMu.Unlock()
		return nil, err
	}
	if err = unix.Flock(int(f.Fd()), unix.LOCK_EX); err != nil {
		f.Close()
		a.mediaMu.Unlock()
		return nil, err
	}
	unlock := func() { _ = unix.Flock(int(f.Fd()), unix.LOCK_UN); _ = f.Close(); a.mediaMu.Unlock() }
	if err = a.replayPrivacyLedger(context.Background()); err != nil {
		a.privacyFault.Store(true)
		unlock()
		return nil, err
	}
	return unlock, nil
}

const permissionVersion = "trama-consultation-v2"
const permissionText = "I allow this studio to store my photos, create private client-specific previews and 3D models, and retain my consultation journey. My material will not be used for promotion, training or the generic catalog. I may ask the professional to remove a photo, withdraw permission or delete my journey without creating an account. Active media and dependent previews/models will be removed and processing cancelled. Any legally required retained information must be explained separately."

func (a *App) listPrivacyRequests(w http.ResponseWriter, r *http.Request) {
	rows, err := a.DB.QueryContext(r.Context(), "SELECT id,action,status,requested_at FROM privacy_requests WHERE organization_id=$1 ORDER BY requested_at DESC LIMIT 100", userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load privacy requests")
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id, action, status string
		var date time.Time
		if err = rows.Scan(&id, &action, &status, &date); err != nil {
			problem(w, 500, "could not load privacy requests")
			return
		}
		items = append(items, map[string]any{"id": id, "action": action, "status": status, "requestedAt": date})
	}
	if err = rows.Err(); err != nil {
		problem(w, 500, "could not load privacy requests")
		return
	}
	respond(w, 200, items)
}

func (a *App) hasPermission(ctx context.Context, clientID string) bool {
	var allowed bool
	err := a.DB.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM client_permissions WHERE client_id=$1 AND withdrawn_at IS NULL) AND NOT EXISTS(SELECT 1 FROM privacy_tombstones WHERE subject_type='client' AND subject_id=$1)`, clientID).Scan(&allowed)
	return err == nil && allowed
}

func (a *App) getPermission(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("clientID")
	if !a.clientExists(r, id) {
		problem(w, 404, "client not found")
		return
	}
	var version, name, method string
	var date time.Time
	var withdrawn sql.NullTime
	err := a.DB.QueryRowContext(r.Context(), "SELECT notice_version,acknowledged_name,method,acknowledged_at,withdrawn_at FROM client_permissions WHERE client_id=$1", id).Scan(&version, &name, &method, &date, &withdrawn)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		problem(w, 500, "could not load permission")
		return
	}
	status := "not acknowledged"
	if err == nil {
		status = "active"
		if withdrawn.Valid {
			status = "withdrawn"
		}
	}
	rows, err := a.DB.QueryContext(r.Context(), "SELECT id,action,status,requested_at FROM privacy_requests WHERE client_id=$1 AND organization_id=$2 ORDER BY requested_at DESC", id, userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load privacy requests")
		return
	}
	defer rows.Close()
	requests := []map[string]any{}
	for rows.Next() {
		var rid, action, state string
		var requested time.Time
		if err = rows.Scan(&rid, &action, &state, &requested); err != nil {
			problem(w, 500, "could not load privacy requests")
			return
		}
		requests = append(requests, map[string]any{"id": rid, "action": action, "status": state, "requestedAt": requested})
	}
	respond(w, 200, map[string]any{"status": status, "noticeVersion": version, "acknowledgedName": name, "method": method, "acknowledgedAt": date, "notice": permissionText, "requests": requests})
}

func (a *App) createPermissionLink(w http.ResponseWriter, r *http.Request) {
	unlock, guardErr := a.lockMedia()
	if guardErr != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	id := r.PathValue("clientID")
	if !a.clientExists(r, id) {
		problem(w, 404, "client not found")
		return
	}
	token, digest, err := newSessionToken()
	if err != nil {
		problem(w, 500, "could not create permission link")
		return
	}
	expires := now().Add(15 * time.Minute)
	if _, err = a.DB.ExecContext(r.Context(), "INSERT INTO permission_links(token_hash,client_id,expires_at) VALUES($1,$2,$3)", digest, id, expires); err != nil {
		problem(w, 500, "could not create permission link")
		return
	}
	respond(w, 201, map[string]any{"path": "/permission/" + token, "expiresAt": expires})
}

func (a *App) permissionClient(r *http.Request) (string, string, error) {
	digest := sha256.Sum256([]byte(r.PathValue("token")))
	var id, name string
	err := a.DB.QueryRowContext(r.Context(), `SELECT c.id,c.name FROM permission_links l JOIN clients c ON c.id=l.client_id WHERE l.token_hash=$1 AND l.expires_at>$2`, digest[:], now()).Scan(&id, &name)
	return id, name, err
}

func (a *App) permissionNotice(w http.ResponseWriter, r *http.Request) {
	_, _, err := a.permissionClient(r)
	if err != nil {
		problem(w, 404, "permission link is expired or unavailable")
		return
	}
	respond(w, 200, map[string]string{"notice": permissionText, "noticeVersion": permissionVersion})
}

func (a *App) acknowledgePermission(w http.ResponseWriter, r *http.Request) {
	unlock, guardErr := a.lockMedia()
	if guardErr != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	id, name, err := a.permissionClient(r)
	if err != nil {
		problem(w, 404, "permission link is expired or unavailable")
		return
	}
	var in struct {
		Name          string `json:"name"`
		Acknowledged  bool   `json:"acknowledged"`
		NoticeVersion string `json:"noticeVersion"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	if !in.Acknowledged || in.NoticeVersion != permissionVersion || !strings.EqualFold(strings.TrimSpace(in.Name), strings.TrimSpace(name)) {
		problem(w, 400, "the client must enter their name and affirm the current notice")
		return
	}
	tx, err := a.DB.BeginTx(r.Context(), nil)
	if err != nil {
		problem(w, 500, "could not record permission")
		return
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(r.Context(), `INSERT INTO client_permissions(client_id,notice_version,acknowledged_name,method,acknowledged_at) VALUES($1,$2,$3,'client entered acknowledgement',$4) ON CONFLICT(client_id) DO UPDATE SET notice_version=excluded.notice_version,acknowledged_name=excluded.acknowledged_name,method=excluded.method,acknowledged_at=excluded.acknowledged_at,withdrawn_at=NULL`, id, permissionVersion, strings.TrimSpace(in.Name), now())
	if err == nil {
		_, err = tx.ExecContext(r.Context(), "DELETE FROM permission_links WHERE client_id=$1", id)
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		problem(w, 500, "could not record permission")
		return
	}
	respond(w, 200, map[string]string{"status": "acknowledged"})
}

type erasedAsset struct {
	ID  string `json:"id"`
	Key string `json:"key"`
}
type erasureEvent struct {
	ID             string        `json:"id"`
	OrganizationID string        `json:"organizationId"`
	ClientID       string        `json:"clientId"`
	Action         string        `json:"action"`
	Assets         []erasedAsset `json:"assets"`
	Runs           []string      `json:"runs"`
	Date           time.Time     `json:"date"`
}

func (a *App) erasureImpact(ctx context.Context, orgID, clientID, assetID string) (erasureEvent, error) {
	e := erasureEvent{ID: newID(), OrganizationID: orgID, ClientID: clientID, Date: now(), Action: "asset deletion", Assets: []erasedAsset{}, Runs: []string{}}
	query := `SELECT id,storage_key FROM assets WHERE client_id=$1 AND organization_id=$2`
	args := []any{clientID, orgID}
	if assetID != "" {
		query = `WITH RECURSIVE dependent(id) AS (SELECT id FROM assets WHERE id=$3 AND client_id=$1 AND organization_id=$2 UNION SELECT a.id FROM assets a JOIN dependent d ON a.source_asset_id=d.id WHERE a.client_id=$1 AND a.organization_id=$2) SELECT id,storage_key FROM assets WHERE id IN (SELECT id FROM dependent)`
		args = append(args, assetID)
	}
	rows, err := a.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return e, err
	}
	for rows.Next() {
		var x erasedAsset
		if err = rows.Scan(&x.ID, &x.Key); err != nil {
			rows.Close()
			return e, err
		}
		e.Assets = append(e.Assets, x)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return e, err
	}
	rows, err = a.DB.QueryContext(ctx, "SELECT r.id,COALESCE(i.asset_id,r.source_asset_id,'') FROM generation_runs r LEFT JOIN demo_job_inputs i ON i.run_id=r.id WHERE r.client_id=$1 AND r.organization_id=$2", clientID, orgID)
	if err != nil {
		return e, err
	}
	seenRuns := map[string]bool{}
	for rows.Next() {
		var run, source string
		if err = rows.Scan(&run, &source); err != nil {
			rows.Close()
			return e, err
		}
		include := assetID == ""
		for _, x := range e.Assets {
			if x.ID == source {
				include = true
			}
		}
		if include && !seenRuns[run] {
			e.Runs = append(e.Runs, run)
			seenRuns[run] = true
		}
	}
	err = rows.Err()
	rows.Close()
	return e, err
}

func (a *App) assetOwner(r *http.Request) (string, error) {
	if !isID(r.PathValue("assetID")) {
		return "", sql.ErrNoRows
	}
	var id string
	err := a.DB.QueryRowContext(r.Context(), "SELECT client_id FROM assets WHERE id=$1 AND organization_id=$2", r.PathValue("assetID"), userFrom(r).OrganizationID).Scan(&id)
	return id, err
}

func (a *App) assetDeletionImpact(w http.ResponseWriter, r *http.Request) {
	id, err := a.assetOwner(r)
	if err != nil {
		problem(w, 404, "image not found")
		return
	}
	e, err := a.erasureImpact(r.Context(), userFrom(r).OrganizationID, id, r.PathValue("assetID"))
	if err != nil {
		problem(w, 500, "could not calculate deletion impact")
		return
	}
	respond(w, 200, map[string]any{"mediaCount": len(e.Assets), "jobCount": len(e.Runs), "explanation": "Removes this photo and all dependent thumbnails, previews and personal models. Related processing will be cancelled."})
}

func (a *App) clientDeletionImpact(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("clientID")
	if !a.clientExists(r, id) {
		problem(w, 404, "client not found")
		return
	}
	e, err := a.erasureImpact(r.Context(), userFrom(r).OrganizationID, id, "")
	if err != nil {
		problem(w, 500, "could not calculate deletion impact")
		return
	}
	respond(w, 200, map[string]any{"mediaCount": len(e.Assets), "jobCount": len(e.Runs), "explanation": "Withdrawal removes all active photos and their dependent previews/models and cancels processing, while retaining the consultation record. Deleting the client also removes the entire journey. Privacy request status is retained without imagery. Any legally required retention must be explained separately."})
}

func (a *App) appendErasure(e erasureEvent) error {
	if a.PrivacyLedgerPath == "" {
		return errors.New("privacy ledger is not configured")
	}
	if err := os.MkdirAll(filepath.Dir(a.PrivacyLedgerPath), 0700); err != nil {
		return err
	}
	f, err := os.OpenFile(a.PrivacyLedgerPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	if err = json.NewEncoder(f).Encode(e); err == nil {
		err = f.Sync()
	}
	closeErr := f.Close()
	if err != nil {
		return err
	}
	if closeErr != nil {
		return closeErr
	}
	d, err := os.Open(filepath.Dir(a.PrivacyLedgerPath))
	if err != nil {
		return err
	}
	defer d.Close()
	return d.Sync()
}

func (a *App) applyErasure(ctx context.Context, e erasureEvent) error {
	tx, err := a.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, x := range e.Assets {
		if _, err = tx.ExecContext(ctx, "DELETE FROM demo_options WHERE id IN(SELECT option_id FROM demo_option_inputs WHERE asset_id=$1)", x.ID); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "DELETE FROM demo_workspace_states WHERE client_id=$1 AND (json_extract(state,'$.photoSetId') IN(SELECT set_id FROM photo_views WHERE asset_id=$2) OR EXISTS(SELECT 1 FROM json_each(state,'$.photoViews') WHERE value=$2))", e.ClientID, x.ID); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "INSERT OR IGNORE INTO privacy_tombstones(subject_type,subject_id) VALUES('asset',$1)", x.ID); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "INSERT OR IGNORE INTO media_purges(storage_key) VALUES($1)", x.Key); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "DELETE FROM assets WHERE id=$1 AND organization_id=$2", x.ID, e.OrganizationID); err != nil {
			return err
		}
	}
	for _, id := range e.Runs {
		if _, err = tx.ExecContext(ctx, "DELETE FROM demo_workspace_states WHERE client_id=$1 AND (json_extract(state,'$.modelRunId')=$2 OR json_extract(state,'$.component.sourceRunId')=$2 OR json_extract(state,'$.component.referenceRunId')=$2)", e.ClientID, id); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "DELETE FROM demo_options WHERE client_id=$1 AND (json_extract(state,'$.modelRunId')=$2 OR json_extract(state,'$.component.sourceRunId')=$2 OR json_extract(state,'$.component.referenceRunId')=$2)", e.ClientID, id); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "INSERT OR IGNORE INTO privacy_tombstones(subject_type,subject_id) VALUES('run',$1)", id); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "UPDATE demo_jobs SET result='{}' WHERE run_id=$1", id); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "UPDATE generation_runs SET status='cancelled',error='Source removed or permission withdrawn',completed_at=$1 WHERE id=$2 AND organization_id=$3", e.Date, id, e.OrganizationID); err != nil {
			return err
		}
	}
	if e.Action == "withdrawal" || e.Action == "client deletion" {
		if _, err = tx.ExecContext(ctx, "DELETE FROM expected_selection_events WHERE consultation_id IN(SELECT id FROM consultations WHERE client_id=$1)", e.ClientID); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "DELETE FROM expected_selections WHERE consultation_id IN(SELECT id FROM consultations WHERE client_id=$1)", e.ClientID); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "DELETE FROM demo_options WHERE client_id=$1", e.ClientID); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "DELETE FROM demo_workspace_states WHERE client_id=$1", e.ClientID); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "UPDATE client_permissions SET withdrawn_at=$1 WHERE client_id=$2 AND acknowledged_at<=$1", e.Date, e.ClientID); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "DELETE FROM permission_links WHERE client_id=$1", e.ClientID); err != nil {
			return err
		}
	}
	if e.Action == "client deletion" {
		if _, err = tx.ExecContext(ctx, "INSERT OR IGNORE INTO privacy_tombstones(subject_type,subject_id) VALUES('client',$1)", e.ClientID); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "DELETE FROM clients WHERE id=$1 AND organization_id=$2", e.ClientID, e.OrganizationID); err != nil {
			return err
		}
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO privacy_requests(id,organization_id,client_id,action,status,requested_at) VALUES($1,$2,$3,$4,'pending',$5) ON CONFLICT(id) DO UPDATE SET status='pending',completed_at=NULL`, e.ID, e.OrganizationID, e.ClientID, e.Action, e.Date)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (a *App) finishErasure(ctx context.Context, e erasureEvent) error {
	var failures []error
	a.cancelLocalDemoRuns(e.Runs)
	for _, id := range e.Runs {
		if a.Temporal != nil {
			if err := a.Temporal.CancelWorkflow(ctx, id, ""); err != nil {
				var missing *serviceerror.NotFound
				if !errors.As(err, &missing) {
					failures = append(failures, err)
				}
			}
		}
	}
	for _, x := range e.Assets {
		if err := a.Storage.Delete(ctx, x.Key); err != nil {
			_, _ = a.DB.ExecContext(ctx, "UPDATE media_purges SET error=$1 WHERE storage_key=$2", err.Error(), x.Key)
			failures = append(failures, err)
		} else {
			_, err = a.DB.ExecContext(ctx, "DELETE FROM media_purges WHERE storage_key=$1", x.Key)
			if err != nil {
				failures = append(failures, err)
			}
		}
	}
	// Personal processing workspaces are scoped to the removed client or affected run.
	workspace := filepath.Join(filepath.Dir(a.PrivacyLedgerPath), "processing", e.ClientID)
	if e.Action == "withdrawal" || e.Action == "client deletion" {
		if err := os.RemoveAll(workspace); err != nil {
			failures = append(failures, err)
		}
	} else {
		for _, id := range e.Runs {
			if err := os.RemoveAll(filepath.Join(workspace, id)); err != nil {
				failures = append(failures, err)
			}
		}
	}
	if len(failures) > 0 {
		return errors.Join(failures...)
	}
	_, err := a.DB.ExecContext(ctx, "UPDATE privacy_requests SET status='completed',completed_at=$1 WHERE id=$2", now(), e.ID)
	return err
}

func (a *App) replayPrivacyLedger(ctx context.Context) error {
	f, err := os.Open(a.PrivacyLedgerPath)
	if errors.Is(err, os.ErrNotExist) {
		var n int
		if err = a.DB.QueryRowContext(ctx, "SELECT count(*) FROM privacy_tombstones").Scan(&n); err != nil {
			return err
		}
		if n > 0 {
			return errors.New("deletion ledger missing; refusing to serve restored data")
		}
		return nil
	}
	if err != nil {
		return err
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 4096), 4<<20)
	for scanner.Scan() {
		var e erasureEvent
		if err = json.Unmarshal(scanner.Bytes(), &e); err != nil {
			return fmt.Errorf("invalid deletion ledger: %w", err)
		}
		if !isID(e.ClientID) || !isID(e.OrganizationID) || !isID(e.ID) {
			return errors.New("invalid deletion ledger identifiers")
		}
		var completed bool
		if err = a.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM privacy_requests WHERE id=$1 AND status='completed')", e.ID).Scan(&completed); err != nil {
			return err
		}
		if completed {
			continue
		}
		if err = a.applyErasure(ctx, e); err != nil {
			return err
		}
		if err = a.finishErasure(ctx, e); err != nil {
			return err
		}
	}
	return scanner.Err()
}

func (a *App) erase(w http.ResponseWriter, r *http.Request, action string) {
	unlock, guardErr := a.lockMedia()
	if guardErr != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	id := r.PathValue("clientID")
	assetID := ""
	if action == "asset deletion" {
		var err error
		id, err = a.assetOwner(r)
		if err != nil {
			problem(w, 404, "image not found")
			return
		}
		assetID = r.PathValue("assetID")
	} else if !a.clientExists(r, id) {
		problem(w, 404, "client not found")
		return
	}
	var in struct {
		Confirmed bool `json:"confirmed"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	if !in.Confirmed {
		problem(w, 400, "review deletion impact and confirm")
		return
	}
	e, err := a.erasureImpact(r.Context(), userFrom(r).OrganizationID, id, assetID)
	if err != nil {
		problem(w, 500, "could not prepare deletion")
		return
	}
	e.Action = action
	if err = a.appendErasure(e); err != nil {
		a.privacyFault.Store(true)
		problem(w, 503, "could not retain deletion safeguard; no deletion performed")
		return
	}
	// Once recorded durably, finish independently of a disconnected HTTP client.
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err = a.applyErasure(ctx, e); err != nil {
		a.privacyFault.Store(true)
		problem(w, 503, "deletion recorded; recovery required before further processing")
		return
	}
	if err = a.finishErasure(ctx, e); err != nil {
		respond(w, 202, map[string]any{"status": "pending cleanup", "requestId": e.ID, "removedMedia": len(e.Assets)})
		return
	}
	respond(w, 200, map[string]any{"status": "completed", "requestId": e.ID, "removedMedia": len(e.Assets)})
}

func (a *App) deleteAsset(w http.ResponseWriter, r *http.Request)        { a.erase(w, r, "asset deletion") }
func (a *App) deleteClient(w http.ResponseWriter, r *http.Request)       { a.erase(w, r, "client deletion") }
func (a *App) withdrawPermission(w http.ResponseWriter, r *http.Request) { a.erase(w, r, "withdrawal") }
