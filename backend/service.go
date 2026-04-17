package main

import "context"

type Repository interface {
	WordCount(ctx context.Context) (WordCount, error)
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
