package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/AndyHolt/darash/backend/internal/morphgnt"
)

type Server struct {
	morphgntHandler *morphgnt.Handler
	tahotHandler    *TahotHandler
}

func NewServer(m *morphgnt.Service, t *TahotService) *Server {
	return &Server{
		morphgntHandler: morphgnt.NewHandler(m),
		tahotHandler:    &TahotHandler{service: t},
	}
}

// Run starts the HTTP server and blocks until it stops. When ctx is cancelled
// (e.g. on SIGTERM) the server is shut down gracefully, draining in-flight
// requests before returning. A clean shutdown is reported as a nil error.
func (s *Server) Run(ctx context.Context, addr string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("GET /api/morphgnt/passage/{ref}", s.morphgntHandler.FetchVerses)
	mux.HandleFunc("GET /api/tahot/passage/{ref}", s.tahotHandler.FetchVerses)

	srv := &http.Server{
		Addr:              addr,
		Handler:           recoverPanic(logRequests(mux)),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	shutdownErr := make(chan error, 1)
	go func() {
		<-ctx.Done()
		slog.Info("shutting down server")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		shutdownErr <- srv.Shutdown(shutdownCtx)
	}()

	slog.Info("server listening", "addr", addr)
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return <-shutdownErr
}
