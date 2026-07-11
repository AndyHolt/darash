package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/AndyHolt/darash/backend/internal/morphgnt"
	"github.com/AndyHolt/darash/backend/internal/sqlite"
	"github.com/AndyHolt/darash/backend/internal/tahot"
)

func main() {
	// Structured logger; level from LOG_LEVEL (default INFO) so health-check
	// request logs (emitted at DEBUG) are hidden unless explicitly enabled.
	logLevel := slog.LevelInfo
	if lvl := os.Getenv("LOG_LEVEL"); lvl != "" {
		_ = logLevel.UnmarshalText([]byte(lvl))
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel})))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// DATA_DB_PATH is the SQLite file the backend serves from. The deployment
	// image sets it via ENV to the baked-in path; `make backend-dev` points it at
	// the local ingest output. It has no compiled-in default on purpose, so the
	// path lives in exactly one place per environment (the Dockerfile, the
	// Makefile) rather than being duplicated as a literal in the binary.
	dbPath := os.Getenv("DATA_DB_PATH")
	if dbPath == "" {
		slog.Error("DATA_DB_PATH is not set")
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	db, err := sqlite.Open(dbPath)
	if err != nil {
		slog.Error("unable to open sqlite database", "err", err)
		os.Exit(1)
	}
	defer func() { _ = db.Close() }()

	morphgntService := morphgnt.NewService(morphgnt.NewSqliteStore(db))
	tahotService := tahot.NewService(tahot.NewSqliteStore(db))

	srv := NewServer(morphgntService, tahotService)
	if err := srv.Run(ctx, ":"+port); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}
