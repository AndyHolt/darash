package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ConnectionConfig struct {
	Host     string
	Port     string
	Database string
	User     string
	Password string
	SSLMode  string
}

func (c ConnectionConfig) Config() (*pgxpool.Config, error) {
	config, err := pgxpool.ParseConfig("")
	if err != nil {
		return nil, fmt.Errorf("parse pool config: %w", err)
	}

	port, err := strconv.Atoi(c.Port)
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %w", err)
	}

	config.ConnConfig.Host = c.Host
	config.ConnConfig.Port = uint16(port)
	config.ConnConfig.Database = c.Database
	config.ConnConfig.User = c.User
	config.ConnConfig.Password = c.Password

	if c.SSLMode == "require" || c.SSLMode == "verify-full" {
		config.ConnConfig.TLSConfig = &tls.Config{
			ServerName: c.Host,
		}
	}

	return config, nil
}

type PgStore struct {
	db *pgxpool.Pool
}

func NewPgStore(ctx context.Context, cfg ConnectionConfig) (*PgStore, error) {
	config, err := cfg.Config()
	if err != nil {
		return nil, fmt.Errorf("connection config: %w", err)
	}

	dbpool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	store := PgStore{
		db: dbpool,
	}

	return &store, nil
}

func (p *PgStore) Close() {
	p.db.Close()
}
