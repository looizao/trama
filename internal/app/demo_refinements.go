package app

import (
	"fmt"
	"math"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

// Refinements change the retained style meshes, never the fitted client's anatomy.
// Physical haircut lengths and growth prediction are outside these proportions.
type DemoStyleEdit struct {
	LengthPercent float64 `json:"lengthPercent"`
	WidthPercent  float64 `json:"widthPercent"`
	VolumeMM      float64 `json:"volumeMm"`
	Color         string  `json:"color"`
}
type DemoBrushStroke struct {
	Kind       string     `json:"kind"`
	Center     [3]float64 `json:"center"`
	Normal     [3]float64 `json:"normal"`
	RadiusMM   float64    `json:"radiusMm"`
	StrengthMM float64    `json:"strengthMm"`
}
type DemoRefinement struct {
	Version string            `json:"version,omitempty"`
	Hair    DemoStyleEdit     `json:"hair"`
	Beard   DemoStyleEdit     `json:"beard"`
	Strokes []DemoBrushStroke `json:"strokes"`
}

func defaultDemoRefinement() DemoRefinement {
	e := DemoStyleEdit{LengthPercent: 100, WidthPercent: 100, Color: "original"}
	return DemoRefinement{Version: "style-mesh-v2", Hair: e, Beard: e, Strokes: []DemoBrushStroke{}}
}
func finiteRange(v, lo, hi float64) bool {
	return !math.IsNaN(v) && !math.IsInf(v, 0) && v >= lo && v <= hi
}
func (e DemoRefinement) validate() string {
	if e.Version != "" && e.Version != "style-mesh-v1" && e.Version != "style-mesh-v2" {
		return "unsupported style deformation version"
	}
	for _, s := range []DemoStyleEdit{e.Hair, e.Beard} {
		if !finiteRange(s.LengthPercent, 75, 125) || !finiteRange(s.WidthPercent, 85, 115) || !finiteRange(s.VolumeMM, -15, 15) {
			return "style geometry adjustment exceeds supported bounds"
		}
		if s.Color != "original" && s.Color != "black" && s.Color != "brown" && s.Color != "blond" && s.Color != "gray" {
			return "unsupported style color"
		}
	}
	if len(e.Strokes) > 64 {
		return "at most 64 retained brush strokes per revision"
	}
	for _, s := range e.Strokes {
		if s.Kind != "hair" && s.Kind != "beard" {
			return "brush may edit hair or beard only"
		}
		if !finiteRange(s.RadiusMM, 5, 50) || !finiteRange(s.StrengthMM, -10, 10) || s.StrengthMM == 0 {
			return "invalid brush radius or strength"
		}
		length := 0.
		for i := 0; i < 3; i++ {
			if !finiteRange(s.Center[i], -1, 1) || !finiteRange(s.Normal[i], -1, 1) {
				return "invalid brush coordinates"
			}
			length += s.Normal[i] * s.Normal[i]
		}
		if length < .99 || length > 1.01 {
			return "brush direction must be a unit vector"
		}
	}
	return ""
}

var writtenEdit = regexp.MustCompile(`^(hair|beard) (length|width|volume|color) ([+-]?[0-9]+(?:\.[0-9]+)?(?:%|mm)?|original|black|brown|blond|gray)$`)

func interpretRefinement(text string, previous DemoRefinement) (DemoRefinement, []string, error) {
	if len(text) == 0 || len(text) > 2000 {
		return previous, nil, fmt.Errorf("write a supported request up to 2000 bytes")
	}
	next := previous
	next.Version = "style-mesh-v2"
	changes := []string{}
	phrases := map[string]string{
		"shorter hair": "hair length 85%", "longer hair": "hair length 115%",
		"more crown volume": "hair volume 8mm", "less hair volume": "hair volume -5mm",
		"narrower hair": "hair width 90%", "wider hair": "hair width 110%",
		"shorter beard": "beard length 85%", "longer beard": "beard length 115%",
		"narrower beard": "beard width 90%", "fuller beard": "beard volume 5mm",
		"cabelo mais curto": "hair length 85%", "cabelo mais longo": "hair length 115%",
		"mais volume no topo": "hair volume 8mm", "menos volume no cabelo": "hair volume -5mm",
		"barba mais curta": "beard length 85%", "barba mais longa": "beard length 115%",
		"barba mais estreita": "beard width 90%", "barba mais cheia": "beard volume 5mm",
	}
	commands := strings.Split(strings.ToLower(strings.TrimSpace(text)), ";")
	if len(commands) > 12 {
		return previous, nil, fmt.Errorf("use at most twelve requests separated by semicolons")
	}
	for _, command := range commands {
		command = strings.TrimSpace(command)
		if expanded, ok := phrases[command]; ok {
			command = expanded
		}
		fields := writtenEdit.FindStringSubmatch(command)
		if fields == nil {
			return previous, nil, fmt.Errorf("unsupported request %q; use the listed requests or hair/beard length, width, volume and color", command)
		}
		target := &next.Hair
		if fields[1] == "beard" {
			target = &next.Beard
		}
		if fields[2] == "color" {
			target.Color = fields[3]
		} else {
			raw := fields[3]
			expected := "%"
			if fields[2] == "volume" {
				expected = "mm"
			}
			if !strings.HasSuffix(raw, expected) {
				return previous, nil, fmt.Errorf("%s requires %s units", fields[2], expected)
			}
			v, err := strconv.ParseFloat(strings.TrimSuffix(raw, expected), 64)
			if err != nil {
				return previous, nil, fmt.Errorf("invalid geometry value")
			}
			switch fields[2] {
			case "length":
				target.LengthPercent = v
			case "width":
				target.WidthPercent = v
			case "volume":
				target.VolumeMM = v
			}
		}
		changes = append(changes, command)
	}
	if message := next.validate(); message != "" {
		return previous, nil, fmt.Errorf("%s", message)
	}
	return next, changes, nil
}
func (a *App) refineDemoProposal(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	var in struct {
		State   DemoWorkspaceState `json:"state"`
		Request string             `json:"request"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	if message := a.validateDemoState(r, &in.State); message != "" {
		problem(w, 400, message)
		return
	}
	if in.State.ModelRunID == "" {
		problem(w, 400, "select a completed client head before refining")
		return
	}
	prior := defaultDemoRefinement()
	if in.State.Refinement != nil {
		prior = *in.State.Refinement
	}
	next, changes, err := interpretRefinement(in.Request, prior)
	if err != nil {
		problem(w, 400, err.Error())
		return
	}
	// Reject a request on an absent or explicitly retained style rather than
	// silently presenting an unchanged asset as a successful refinement.
	for _, c := range changes {
		if strings.HasPrefix(c, "hair ") && (in.State.HairID == "none" || in.State.HairID == "keep-current") {
			problem(w, 400, "choose a proposed hairstyle before refining it")
			return
		}
		if strings.HasPrefix(c, "beard ") && (in.State.BeardID == "clean-shaven" || in.State.BeardID == "keep-current") {
			problem(w, 400, "choose a proposed beardstyle before refining it")
			return
		}
	}
	in.State.Refinement = &next
	in.State.RevisionNote = strings.TrimSpace(in.Request)
	respond(w, 200, map[string]any{"state": in.State, "changes": changes, "scope": "Defined local mesh proportions and material tint; not a physical cut simulation or likeness correction. Save an edited revision to preserve it."})
}
