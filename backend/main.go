package main

import (
	"context"
	"fmt"
	"log"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	connConfig := ConnectionConfig{
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		Database: os.Getenv("DB_NAME"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
	}

	store, err := NewPgStore(context.Background(), connConfig)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to create db connection pool: %v\n", err)
		os.Exit(1)
	}
	defer store.Close()

	morphgntService := NewMorphgntService(store)

	srv := NewServer(morphgntService)
	log.Fatal(srv.ListenAndServe(":" + port))
}
