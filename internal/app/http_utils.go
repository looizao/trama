package app

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
)

func decodeJSON(r *http.Request, out any) error {
	if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") { return errors.New("Content-Type must be application/json") }
	dec := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	dec.DisallowUnknownFields()
	if err := dec.Decode(out); err != nil { return err }
	var extra any
	if err := dec.Decode(&extra); err != io.EOF { return errors.New("only one JSON object is allowed") }
	return nil
}

func respond(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func problem(w http.ResponseWriter, status int, message string) { respond(w, status, map[string]string{"error": message}) }

func badRequest(w http.ResponseWriter, err error) { problem(w, http.StatusBadRequest, err.Error()) }
