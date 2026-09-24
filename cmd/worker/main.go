package main

import (
	"context"
	"log"

	"github.com/looizao/trama/internal/app"
	"go.temporal.io/sdk/activity"
	"go.temporal.io/sdk/worker"
)

func main() {
	a, err := app.Open(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	defer a.Close()
	if err := a.ConnectTemporal(); err != nil {
		log.Fatal(err)
	}
	w := worker.New(a.Temporal, app.TaskQueue, worker.Options{MaxConcurrentActivityExecutionSize: 3})
	w.RegisterWorkflow(app.GenerateWorkflow)
	w.RegisterActivityWithOptions(a.GenerateImages, activity.RegisterOptions{Name: "GenerateImages"})
	w.RegisterActivityWithOptions(a.FailRun, activity.RegisterOptions{Name: "FailRun"})
	log.Printf("Temporal worker listening on task queue %s", app.TaskQueue)
	if err := w.Run(worker.InterruptCh()); err != nil {
		log.Fatal(err)
	}
}
