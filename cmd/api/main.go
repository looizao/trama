package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/looizao/trama/internal/app"
	"go.temporal.io/sdk/activity"
	"go.temporal.io/sdk/worker"
)

func main() {
	if target := strings.TrimSpace(os.Getenv("MIGRATION_REDIRECT_URL")); target != "" {
		handler, err := migrationRedirectHandler(target)
		if err != nil {
			log.Fatal(err)
		}
		serve(handler)
		return
	}

	ctx := context.Background()
	a, err := app.Open(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer a.Close()
	if os.Getenv("TEMPORAL_ADDRESS") != "" {
		if err := a.ConnectTemporal(); err != nil {
			log.Fatal(err)
		}
	}
	if os.Getenv("RUN_WORKER_IN_API") == "true" && a.Temporal != nil {
		w := worker.New(a.Temporal, app.TaskQueue, worker.Options{MaxConcurrentActivityExecutionSize: 2})
		w.RegisterWorkflow(app.GenerateWorkflow)
		w.RegisterActivityWithOptions(a.GenerateImages, activity.RegisterOptions{Name: "GenerateImages"})
		w.RegisterActivityWithOptions(a.FailRun, activity.RegisterOptions{Name: "FailRun"})
		if err := w.Start(); err != nil {
			log.Fatal(err)
		}
		defer w.Stop()
		log.Print("Temporal worker started in API process")
	}
	serve(a.Handler())
}

func serve(handler http.Handler) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	host := os.Getenv("HOST")
	server := &http.Server{Addr: host + ":" + port, Handler: handler, ReadHeaderTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	go func() {
		log.Printf("listening on :%s", port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	shutdown, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_ = server.Shutdown(shutdown)
}

func migrationRedirectHandler(rawTarget string) (http.Handler, error) {
	target, err := url.Parse(rawTarget)
	if err != nil || target.Scheme != "https" || target.Host == "" || target.User != nil {
		return nil, fmt.Errorf("MIGRATION_REDIRECT_URL must be an absolute HTTPS URL")
	}
	target.RawQuery = ""
	target.Fragment = ""

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if r.Method == http.MethodGet {
			_, _ = w.Write([]byte(`{"status":"redirecting"}`))
		}
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		destination := *target
		destination.Path = strings.TrimRight(target.Path, "/") + "/" + strings.TrimLeft(r.URL.Path, "/")
		destination.RawPath = ""
		destination.RawQuery = r.URL.RawQuery
		w.Header().Set("Cache-Control", "no-store")
		http.Redirect(w, r, destination.String(), http.StatusTemporaryRedirect)
	})
	return mux, nil
}
