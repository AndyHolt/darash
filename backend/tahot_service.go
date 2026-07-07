package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
)

var ErrNotOldTestament = errors.New("reference must be in the Old Testament")

type TahotRepository interface {
	FetchTahotVerses(ctx context.Context, r ref.Reference) ([]TahotWord, error)
}

type TahotService struct {
	repo TahotRepository
}

func NewTahotService(repo TahotRepository) *TahotService {
	return &TahotService{repo: repo}
}

func (s *TahotService) FetchVerses(ctx context.Context, r ref.Reference) (TahotPassage, error) {
	if r.Testament() != ref.OldTestament {
		return TahotPassage{}, ErrNotOldTestament
	}
	words, err := s.repo.FetchTahotVerses(ctx, r)
	if err != nil {
		return TahotPassage{}, fmt.Errorf("fetch passage: %w", err)
	}
	if len(words) == 0 {
		return TahotPassage{}, ErrNoWordsFound
	}
	return TahotPassage{
		Reference: r,
		Verses:    groupVerses(words),
	}, nil
}

// groupVerses groups consecutive runs of equal (Chapter, Verse) into Verses.
// Words are assumed already ordered by token id (which the store guarantees via
// the ORDER BY in tahotVersesSelect), so consecutive equal references are
// contiguous.
func groupVerses(words []TahotWord) []TahotVerse {
	if len(words) == 0 {
		return nil
	}
	verses := []TahotVerse{{Chapter: words[0].Chapter, Verse: words[0].Verse}}
	last := &verses[0]
	for _, w := range words {
		if w.Chapter != last.Chapter || w.Verse != last.Verse {
			verses = append(verses, TahotVerse{Chapter: w.Chapter, Verse: w.Verse})
			last = &verses[len(verses)-1]
		}
		last.Words = append(last.Words, w)
	}
	return verses
}
