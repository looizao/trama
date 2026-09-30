package app

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type DemoCandidate struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Role       string `json:"role"`
	Dependency string `json:"dependency"`
	Status     string `json:"status"`
}

var demoCandidates = []DemoCandidate{
	{"blender-mpfb", "Blender + MPFB", "Parametric head fitting", "", "pending"},
	{"colmap", "COLMAP / PyCOLMAP", "Photogrammetric reconstruction", "", "pending"},
	{"meshroom", "Meshroom / AliceVision", "Photogrammetric reconstruction", "", "pending"},
	{"makehuman", "Standalone MakeHuman", "Parametric head fitting", "", "pending"},
	{"flame", "FLAME 2023 Open", "Parametric head fitting", "", "pending"},
	{"open3d", "Open3D", "Supporting geometry processing", "Requires an identified reconstruction or fitting result", "pending"},
	{"meshlab", "MeshLab / PyMeshLab", "Supporting mesh processing", "Requires an identified reconstruction or fitting result", "pending"},
	{"cloudcompare", "CloudCompare", "Supporting alignment and comparison", "Requires an identified reconstruction or fitting result", "pending"},
}

func validDemoCandidate(id string) bool {
	for _, c := range demoCandidates {
		if c.ID == id {
			return true
		}
	}
	return false
}

type DemoStyle struct {
	ID          string  `json:"id"`
	Kind        string  `json:"kind"`
	Label       string  `json:"label"`
	Length      string  `json:"length"`
	LengthMm    float64 `json:"lengthMm"`
	Texture     string  `json:"texture"`
	Maintenance string  `json:"maintenance"`
	License     string  `json:"license"`
	Creator     string  `json:"creator"`
	SourceURL   string  `json:"sourceUrl"`
	ModelURL    string  `json:"modelUrl"`
	RenderURL   string  `json:"renderUrl"`
	Bytes       int64   `json:"bytes"`
	Glb         string  `json:"-"`
	Render      string  `json:"-"`
}

func demoAssetRoot() string { return strings.TrimSpace(os.Getenv("DEMO_ASSET_DIR")) }
func readDemoStyles(kind string) ([]DemoStyle, error) {
	if kind != "hair" && kind != "beard" {
		return nil, errors.New("unknown catalog")
	}
	root := demoAssetRoot()
	if root == "" {
		return nil, errors.New("local demo asset directory is not configured")
	}
	raw, err := os.ReadFile(filepath.Join(root, kind+"-catalog.json"))
	if err != nil {
		return nil, err
	}
	var records []struct {
		DemoStyle
		Glb    string `json:"glb"`
		Render string `json:"render"`
	}
	if err = json.Unmarshal(raw, &records); err != nil {
		return nil, err
	}
	styles := []DemoStyle{}
	for _, record := range records {
		s := record.DemoStyle
		s.Glb = record.Glb
		s.Render = record.Render
		if s.ID == "" || strings.ContainsAny(s.ID, "/\\.") {
			return nil, errors.New("invalid catalog identifier")
		}
		s.Kind = kind
		s.ModelURL = "/api/demo-library/" + kind + "/" + s.ID + "/model"
		s.RenderURL = "/api/demo-library/" + kind + "/" + s.ID + "/render"
		styles = append(styles, s)
	}
	return styles, nil
}
func (a *App) listDemoLibrary(w http.ResponseWriter, r *http.Request) {
	hair, err := readDemoStyles("hair")
	if err != nil {
		problem(w, 503, "local demo asset library is unavailable")
		return
	}
	beard, err := readDemoStyles("beard")
	if err != nil {
		problem(w, 503, "local demo asset library is unavailable")
		return
	}
	respond(w, 200, map[string]any{"hair": hair, "beard": beard, "headUrl": "/api/demo-library/head/neutral/model", "geometry": "Shared synthetic mannequin; not a reconstructed client head", "candidates": demoCandidates})
}
func (a *App) demoLibraryContent(w http.ResponseWriter, r *http.Request) {
	kind, id, format := r.PathValue("kind"), r.PathValue("styleID"), r.PathValue("format")
	root := demoAssetRoot()
	if root == "" {
		problem(w, 503, "local demo asset library is unavailable")
		return
	}
	file := ""
	if kind == "head" && id == "neutral" && format == "model" {
		file = "neutral-head.glb"
	} else {
		styles, err := readDemoStyles(kind)
		if err != nil {
			problem(w, 404, "catalog asset not found")
			return
		}
		for _, s := range styles {
			if s.ID == id {
				if format == "model" {
					file = s.Glb
				} else if format == "render" {
					file = s.Render
				}
			}
		}
	}
	if kind == "hair" || kind == "beard" {
		extension := ".glb"
		if format == "render" {
			extension = ".png"
		}
		if file != kind+"/"+id+extension {
			problem(w, 404, "catalog asset not found")
			return
		}
	}
	if file == "" {
		problem(w, 404, "catalog asset not found")
		return
	}
	// Resolve symlinks as well as traversal. Only files enumerated by the local
	// catalog can be served; model directories and private clients are excluded.
	base, err := filepath.EvalSymlinks(root)
	if err != nil {
		problem(w, 404, "catalog asset not found")
		return
	}
	path, err := filepath.EvalSymlinks(filepath.Join(base, file))
	if err != nil {
		problem(w, 404, "catalog asset not found")
		return
	}
	relative, err := filepath.Rel(base, path)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) || filepath.IsAbs(relative) {
		problem(w, 404, "catalog asset not found")
		return
	}
	w.Header().Set("Cache-Control", "private, no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if format == "model" {
		w.Header().Set("Content-Type", "model/gltf-binary")
	} else {
		w.Header().Set("Content-Type", "image/png")
	}
	http.ServeFile(w, r, path)
}
