package morphgnt

import (
	"context"
	"errors"
	"fmt"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
)

var ErrNotNewTestament = errors.New("reference must be in the New Testament")

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
	if r.Testament() != ref.NewTestament {
		return Passage{}, ErrNotNewTestament
	}
	words, err := s.repo.FetchVerses(ctx, r)
	if err != nil {
		return Passage{}, fmt.Errorf("fetch passage: %w", err)
	}
	if len(words) == 0 {
		return Passage{}, ref.ErrNoWordsFound
	}
	return Passage{
		Reference:  r,
		Paragraphs: groupParagraphs(words),
	}, nil
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
