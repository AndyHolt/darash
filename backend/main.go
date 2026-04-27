package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
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
