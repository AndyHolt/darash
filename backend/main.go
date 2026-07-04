package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
)

func main() {
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

	connConfig := ConnectionConfig{
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

	store, err := NewPgStore(ctx, connConfig)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to create db connection pool: %v\n", err)
		os.Exit(1)
	}
	defer store.Close()

	morphgntService := NewMorphgntService(store)
	tahotService := NewTahotService(store)

	srv := NewServer(morphgntService, tahotService)
	if err := srv.Run(ctx, ":"+port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
