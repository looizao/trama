package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/looizao/trama/internal/app"
)

func main() {
	ctx:=context.Background()
	a,err:=app.Open(ctx); if err!=nil { log.Fatal(err) }; defer a.Close()
	if os.Getenv("TEMPORAL_ADDRESS")!="" { if err:=a.ConnectTemporal(); err!=nil { log.Fatal(err) } }
	port:=os.Getenv("PORT"); if port=="" { port="8080" }
	server:=&http.Server{Addr:":"+port,Handler:a.Handler(),ReadHeaderTimeout:10*time.Second,IdleTimeout:60*time.Second}
	go func() { log.Printf("listening on :%s",port); if err:=server.ListenAndServe(); err!=nil && !errors.Is(err,http.ErrServerClosed) { log.Fatal(err) } }()
	stop:=make(chan os.Signal,1); signal.Notify(stop,syscall.SIGINT,syscall.SIGTERM); <-stop
	shutdown,cancel:=context.WithTimeout(context.Background(),15*time.Second); defer cancel(); _=server.Shutdown(shutdown)
}
