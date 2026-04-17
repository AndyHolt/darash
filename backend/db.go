package main

import (
	"context"
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
}

func (c ConnectionConfig) Config() (*pgxpool.Config, error) {
	config, err := pgxpool.ParseConfig("")
	if err != nil {
		return &pgxpool.Config{}, fmt.Errorf("parse pool config: %w", err)
	}

	port, err := strconv.Atoi(c.Port)
	if err != nil {
		return &pgxpool.Config{}, fmt.Errorf("invalid DB_PORT: %w", err)
	}

	config.ConnConfig.Host = c.Host
	config.ConnConfig.Port = uint16(port)
	config.ConnConfig.Database = c.Database
	config.ConnConfig.User = c.User
	config.ConnConfig.Password = c.Password

	return config, nil
}

type PgStore struct {
	db *pgxpool.Pool
}

func NewPgStore(ctx context.Context, cfg ConnectionConfig) (*PgStore, error) {
	config, err := cfg.Config()
	if err != nil {
		return &PgStore{}, fmt.Errorf("connection config: %w", err)
	}

	dbpool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return &PgStore{}, fmt.Errorf("create pool: %w", err)
	}

	store := PgStore{
		db: dbpool,
	}

	return &store, nil
}

func (p *PgStore) Close() {
	p.db.Close()
}

func (p *PgStore) WordCount(ctx context.Context) (WordCount, error) {
	query := "SELECT COUNT(*) FROM morphgnt_sblgnt"

	var count int64
	err := p.db.QueryRow(ctx, query).Scan(&count)
	if err != nil {
		return WordCount{}, fmt.Errorf("failed to get word count: %w", err)
	}

	return WordCount{Count: count}, nil
}
