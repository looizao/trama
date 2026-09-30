package app

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"regexp"
	"sort"
)

var nativeStyleID = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$`)

// Each retained job enumerates its own available assets. Expanding the shared
// catalog must never replace old geometry or pretend new styles were exported.
func retainedStyleIDs(result map[string]any, kind string) ([]string, error) {
	entries, ok := result[kind].(map[string]any)
	if !ok || len(entries) == 0 || len(entries) > 250 {
		return nil, errors.New("missing retained independent styles")
	}
	ids := make([]string, 0, len(entries))
	for id, path := range entries {
		if !nativeStyleID.MatchString(id) || path != kind+"/"+id+".glb" {
			return nil, errors.New("unexpected retained style path")
		}
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids, nil
}

func writeNativeCatalogSnapshot(dir string, upstream map[string]any) error {
	styles := map[string][]DemoStyle{}
	var parent map[string]any
	if upstream != nil {
		raw, ok := upstream["retainedResult"].(string)
		if !ok || json.Unmarshal([]byte(raw), &parent) != nil {
			return errors.New("invalid upstream style snapshot")
		}
	}
	for _, kind := range []string{"hair", "beard"} {
		catalog, err := readDemoStyles(kind)
		if err != nil {
			return err
		}
		if parent == nil {
			styles[kind] = catalog
		} else {
			ids, err := retainedStyleIDs(parent, kind)
			if err != nil {
				return err
			}
			for _, id := range ids {
				found := false
				for _, style := range catalog {
					if style.ID == id {
						styles[kind] = append(styles[kind], style)
						found = true
						break
					}
				}
				if !found {
					return errors.New("upstream style metadata is unavailable")
				}
			}
		}
	}
	return os.WriteFile(filepath.Join(dir, "style-catalog.json"), rawJSON(styles), 0600)
}
