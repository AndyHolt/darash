package tahot

import (
	"context"
	"errors"
	"fmt"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
)

var ErrNotOldTestament = errors.New("reference must be in the Old Testament")

type Repository interface {
	FetchVerses(ctx context.Context, r ref.Reference) ([]Word, error)
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) FetchVerses(ctx context.Context, r ref.Reference) (Passage, error) {
	if r.Testament() != ref.OldTestament {
		return Passage{}, ErrNotOldTestament
	}
	words, err := s.repo.FetchVerses(ctx, r)
	if err != nil {
		return Passage{}, fmt.Errorf("fetch passage: %w", err)
	}
	if len(words) == 0 {
		return Passage{}, ref.ErrNoWordsFound
	}
	return Passage{
		Reference: r,
		Verses:    groupVerses(words),
	}, nil
}

// groupVerses groups consecutive runs of equal (Chapter, Verse) into Verses.
// Words are assumed already ordered by token id (which the store guarantees via
// the ORDER BY in versesSelect), so consecutive equal references are
// contiguous.
func groupVerses(words []Word) []Verse {
	if len(words) == 0 {
		return nil
	}
	verses := []Verse{{Chapter: words[0].Chapter, Verse: words[0].Verse}}
	last := &verses[0]
	for _, w := range words {
		if w.Chapter != last.Chapter || w.Verse != last.Verse {
			verses = append(verses, Verse{Chapter: w.Chapter, Verse: w.Verse})
			last = &verses[len(verses)-1]
		}
		last.Words = append(last.Words, w)
	}
	return verses
}
