package main

import (
	"context"
	"errors"
	"fmt"
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
		return Passage{}, fmt.Errorf("fetch passage: %w", err)
	}
	if len(passage.Words) == 0 {
		return Passage{}, ErrNoWordsFound
	}
	passage.Paragraphs = groupParagraphs(passage.Words)
	return passage, nil
}

// groupParagraphs groups consecutive runs of equal ParagraphID into Paragraphs.
// Words are assumed already ordered by token id (which the store guarantees
// via the ORDER BY in versesSelect), so consecutive equal ParagraphIDs are
// contiguous.
func groupParagraphs(words []Word) []Paragraph {
	if len(words) == 0 {
		return nil
	}
	paragraphs := []Paragraph{{ID: words[0].ParagraphID}}
	last := &paragraphs[0]
	for _, w := range words {
		if w.ParagraphID != last.ID {
			paragraphs = append(paragraphs, Paragraph{ID: w.ParagraphID})
			last = &paragraphs[len(paragraphs)-1]
		}
		last.Words = append(last.Words, w)
	}
	return paragraphs
}
