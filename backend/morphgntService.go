package main

import "context"

type Repository interface {
	WordCount(ctx context.Context) (WordCount, error)
	FetchVerses(ctx context.Context, ref Reference) (Passage, error)
}

type MorphgntService struct {
	repo Repository
}

func NewMorphgntService(repo Repository) *MorphgntService {
	return &MorphgntService{repo: repo}
}

func (s MorphgntService) Count(ctx context.Context) (WordCount, error) {
	return s.repo.WordCount(ctx)
}

func (s MorphgntService) FetchVerses(ctx context.Context, ref Reference) (Passage, error) {
	return s.repo.FetchVerses(ctx, ref)
}
