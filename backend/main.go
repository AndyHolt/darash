package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/AndyHolt/darash/backend/internal/morphgnt"
	"github.com/AndyHolt/darash/backend/internal/postgres"
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

	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		sslMode = "verify-full"
	}

	iamAuth, _ := strconv.ParseBool(os.Getenv("DB_IAM_AUTH"))

	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "eu-west-1"
	}

	connConfig := postgres.Config{
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		Database: os.Getenv("DB_NAME"),
		User:     os.Getenv("DB_USER"),
		SSLMode:  sslMode,
		IAMAuth:  iamAuth,
		Region:   region,
	}
	if !iamAuth {
		connConfig.Password = os.Getenv("DB_PASSWORD")
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := postgres.NewPool(ctx, connConfig)
	if err != nil {
		slog.Error("unable to create db connection pool", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	morphgntService := morphgnt.NewService(morphgnt.NewStore(pool))
	tahotService := NewTahotService(newTahotStore(pool))

	srv := NewServer(morphgntService, tahotService)
	if err := srv.Run(ctx, ":"+port); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}
