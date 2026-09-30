package app

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"
)

type ComponentDemoSettings struct {
	SourceRunID    string  `json:"sourceRunId"`
	ReferenceRunID string  `json:"referenceRunId,omitempty"`
	TriangleRatio  float64 `json:"triangleRatio"`
	VoxelSize      float64 `json:"voxelSize"`
	SamplePoints   int     `json:"samplePoints"`
	ICPIterations  int     `json:"icpIterations,omitempty"`
	ICPOverlap     int     `json:"icpOverlap,omitempty"`
}

func componentDemoDefaults() ComponentDemoSettings {
	return ComponentDemoSettings{TriangleRatio: .75, VoxelSize: .003, SamplePoints: 12000}
}
func (s ComponentDemoSettings) validate() string {
	if !isID(s.SourceRunID) {
		return "select a completed upstream native head experiment"
	}
	if s.ReferenceRunID != "" && (!isID(s.ReferenceRunID) || s.ReferenceRunID == s.SourceRunID) {
		return "comparison reference must be a different completed native experiment"
	}
	if !(s.TriangleRatio >= .25 && s.TriangleRatio <= 1 && s.VoxelSize >= .001 && s.VoxelSize <= .01 && s.SamplePoints >= 2000 && s.SamplePoints <= 50000) {
		return "component processing settings outside supported bounds"
	}
	if s.ICPIterations != 0 && (s.ICPIterations < 10 || s.ICPIterations > 200) || s.ICPOverlap != 0 && (s.ICPOverlap < 50 || s.ICPOverlap > 100) {
		return "ICP settings outside supported bounds"
	}
	return ""
}
func nativeModelKind(kind string) bool { return kind == "fit" || kind == "process" }
func componentCandidate(candidate string) bool {
	return candidate == "open3d" || candidate == "meshlab" || candidate == "cloudcompare"
}

// A copied model remains dependent on every upstream experiment. This check
// runs under the media lock when queuing, publishing and serving artifacts.
func (a *App) nativeParentsAvailable(ctx context.Context, id string) bool {
	rows, err := a.DB.QueryContext(ctx, `WITH RECURSIVE parents(id) AS (
 SELECT source_run_id FROM demo_job_dependencies WHERE run_id=$1
 UNION SELECT s.source_run_id FROM demo_job_dependencies s JOIN parents p ON s.run_id=p.id)
 SELECT 1
 FROM parents p LEFT JOIN generation_runs r ON r.id=p.id LEFT JOIN demo_jobs j ON j.run_id=p.id
 WHERE NOT EXISTS(SELECT 1 FROM generation_runs own WHERE own.id=$1 AND own.client_id=r.client_id AND own.organization_id=r.organization_id) OR r.status<>'completed' OR j.kind NOT IN ('fit','process')
 OR (SELECT count(*) FROM demo_job_inputs i JOIN assets x ON x.id=i.asset_id WHERE i.run_id=r.id AND x.kind='source' AND x.client_id=r.client_id AND x.organization_id=r.organization_id)<>6
 OR EXISTS(SELECT 1 FROM privacy_tombstones t WHERE t.subject_type='run' AND t.subject_id=r.id)`, id)
	if err != nil {
		return false
	}
	defer rows.Close()
	if rows.Next() || rows.Err() != nil {
		return false
	}
	var kind string
	var count int
	var erased bool
	var settings string
	err = a.DB.QueryRowContext(ctx, "SELECT j.kind,j.settings,(SELECT count(*) FROM demo_job_dependencies s WHERE s.run_id=j.run_id),EXISTS(SELECT 1 FROM privacy_tombstones t WHERE t.subject_type='run' AND t.subject_id=j.run_id) FROM demo_jobs j WHERE run_id=$1", id).Scan(&kind, &settings, &count, &erased)
	if err != nil || erased {
		return false
	}
	if kind != "process" {
		return count == 0
	}
	var input struct {
		Component ComponentDemoSettings `json:"component"`
	}
	if json.Unmarshal([]byte(settings), &input) != nil || input.Component.validate() != "" {
		return false
	}
	expected := 1
	if input.Component.ReferenceRunID != "" {
		expected++
	}
	var primary, reference bool
	err = a.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM demo_job_dependencies WHERE run_id=$1 AND source_run_id=$2),EXISTS(SELECT 1 FROM demo_job_dependencies WHERE run_id=$1 AND source_run_id=$3)", id, input.Component.SourceRunID, input.Component.ReferenceRunID).Scan(&primary, &reference)
	return err == nil && count == expected && primary && (input.Component.ReferenceRunID == "" || reference)
}
func (a *App) validateComponentSource(r *http.Request, source string, set string, inputs map[string]string) bool {
	var status, kind string
	if a.DB.QueryRowContext(r.Context(), "SELECT r.status,j.kind FROM generation_runs r JOIN demo_jobs j ON j.run_id=r.id WHERE r.id=$1 AND r.client_id=$2 AND r.organization_id=$3 AND j.photo_set_id=$4", source, r.PathValue("clientID"), userFrom(r).OrganizationID, set).Scan(&status, &kind) != nil || status != "completed" || !nativeModelKind(kind) || !a.nativeParentsAvailable(r.Context(), source) {
		return false
	}
	original, err := a.demoInputs(r.Context(), source)
	if err != nil || len(original) != 6 {
		return false
	}
	for _, input := range original {
		if inputs[input.View] != input.ID {
			return false
		}
	}
	_, err = safeNativeFile(a.demoJobDirectory(r.PathValue("clientID"), source), "head.glb")
	return err == nil
}
func (a *App) demoRunDescendants(ctx context.Context, seeds []string, client, org string) ([]string, error) {
	seen := map[string]bool{}
	queue := append([]string{}, seeds...)
	result := []string{}
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]
		if seen[id] {
			continue
		}
		seen[id] = true
		var found string
		if err := a.DB.QueryRowContext(ctx, "SELECT id FROM generation_runs WHERE id=$1 AND client_id=$2 AND organization_id=$3", id, client, org).Scan(&found); err != nil {
			return nil, err
		}
		result = append(result, id)
		rows, err := a.DB.QueryContext(ctx, "SELECT s.run_id FROM demo_job_dependencies s JOIN generation_runs r ON r.id=s.run_id WHERE s.source_run_id=$1 AND r.client_id=$2 AND r.organization_id=$3", id, client, org)
		if err != nil {
			return nil, err
		}
		for rows.Next() {
			var child string
			if err = rows.Scan(&child); err != nil {
				rows.Close()
				return nil, err
			}
			queue = append(queue, child)
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return nil, err
		}
	}
	return result, nil
}
func (a *App) copyComponentSource(ctx context.Context, client, id, dir string) (map[string]any, error) {
	var settings string
	err := a.DB.QueryRowContext(ctx, "SELECT settings FROM demo_jobs WHERE run_id=$1", id).Scan(&settings)
	var input struct {
		Component ComponentDemoSettings `json:"component"`
	}
	if err == nil {
		err = json.Unmarshal([]byte(settings), &input)
	}
	if err != nil || !a.nativeParentsAvailable(ctx, id) {
		return nil, errors.New("upstream native head is no longer available")
	}
	primary, err := a.copyComponentModel(ctx, client, input.Component.SourceRunID, dir, "upstream")
	if err != nil {
		return nil, err
	}
	if input.Component.ReferenceRunID != "" {
		reference, err := a.copyComponentModel(ctx, client, input.Component.ReferenceRunID, dir, "reference-upstream")
		if err != nil {
			return nil, err
		}
		primary["reference"] = reference
	}
	return primary, nil
}
func (a *App) copyComponentModel(ctx context.Context, client, source, dir, relative string) (map[string]any, error) {
	var candidate, result string
	err := a.DB.QueryRowContext(ctx, "SELECT candidate,result FROM demo_jobs WHERE run_id=$1", source).Scan(&candidate, &result)
	if err != nil {
		return nil, err
	}
	dest := filepath.Join(dir, relative)
	if err = os.MkdirAll(dest, 0700); err != nil {
		return nil, err
	}
	files := []string{"head.glb"}
	for _, kind := range []string{"hair", "beard"} {
		styles, e := readDemoStyles(kind)
		if e != nil {
			return nil, e
		}
		if err = os.MkdirAll(filepath.Join(dest, kind), 0700); err != nil {
			return nil, err
		}
		for _, style := range styles {
			files = append(files, kind+"/"+style.ID+".glb")
		}
	}
	hashes := map[string]string{}
	for _, rel := range files {
		file, e := safeNativeFile(a.demoJobDirectory(client, source), rel)
		if e != nil {
			return nil, e
		}
		data, e := os.ReadFile(file)
		if e != nil {
			return nil, e
		}
		if len(data) < 12 || string(data[:4]) != "glTF" {
			return nil, errors.New("invalid upstream native GLB")
		}
		sum := sha256.Sum256(data)
		hashes[rel] = hex.EncodeToString(sum[:])
		if e = os.WriteFile(filepath.Join(dest, rel), data, 0600); e != nil {
			return nil, e
		}
	}
	return map[string]any{"runId": source, "candidate": candidate, "path": relative, "sha256": hashes, "retainedResult": result, "geometry": "Processed fitted geometry with inferred hidden surfaces; upstream fit is not observed 3D geometry."}, nil
}
