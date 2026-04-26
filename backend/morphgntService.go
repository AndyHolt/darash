package main

import (
	"context"
	"errors"
)

var (
	ErrNotNewTestament = errors.New("reference must be in the New Testament")
	ErrNoWordsFound    = errors.New("no words found for reference")
)

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

func (s *MorphgntService) Count(ctx context.Context) (WordCount, error) {
	return s.repo.WordCount(ctx)
}

func (s *MorphgntService) FetchVerses(ctx context.Context, ref Reference) (Passage, error) {
	if ref.Testament() != NewTestament {
		return Passage{}, ErrNotNewTestament
	}
	passage, err := s.repo.FetchVerses(ctx, ref)
	if err != nil {
		return Passage{}, err
	}
	if len(passage.Words) == 0 {
		return Passage{}, ErrNoWordsFound
	}
	return passage, nil
}
