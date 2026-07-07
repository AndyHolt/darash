package main

import (
	"context"
	"fmt"

	"github.com/AndyHolt/darash/backend/internal/postgres"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PgStore struct {
	db *pgxpool.Pool
}

func NewPgStore(ctx context.Context, cfg postgres.Config) (*PgStore, error) {
	pool, err := postgres.NewPool(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("new pool: %w", err)
	}
	return &PgStore{db: pool}, nil
}

func (p *PgStore) Close() {
	p.db.Close()
}
