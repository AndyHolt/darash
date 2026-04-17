package main

import (
	"context"
	"fmt"
)

func (p *PgStore) WordCount(ctx context.Context) (WordCount, error) {
	query := "SELECT COUNT(*) FROM morphgnt_sblgnt"

	var count int64
	err := p.db.QueryRow(ctx, query).Scan(&count)
	if err != nil {
		return WordCount{}, fmt.Errorf("failed to get word count: %w", err)
	}

	return WordCount{Count: count}, nil
}
