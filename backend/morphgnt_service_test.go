package main

import (
	"context"
	"errors"
	"testing"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
)

type fakeRepo struct {
	fetchCalled bool
	words       []Word
	err         error
}

func (f *fakeRepo) FetchVerses(_ context.Context, _ ref.Reference) ([]Word, error) {
	f.fetchCalled = true
	return f.words, f.err
}

func TestFetchVersesRejectsOldTestament(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewMorphgntService(repo)

	_, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.Genesis, Chapter: 1, Verse: 1})
	if !errors.Is(err, ErrNotNewTestament) {
		t.Fatalf("err = %v, want ErrNotNewTestament", err)
	}
	if repo.fetchCalled {
		t.Error("repo.FetchVerses was called for OT reference; should short-circuit in service")
	}
}

func TestFetchVersesEmptyResultReturnsError(t *testing.T) {
	repo := &fakeRepo{words: []Word{}}
	svc := NewMorphgntService(repo)

	_, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.John, Chapter: 3, Verse: 16})
	if !errors.Is(err, ref.ErrNoWordsFound) {
		t.Fatalf("err = %v, want ErrNoWordsFound", err)
	}
}

func TestFetchVersesAcceptsNewTestament(t *testing.T) {
	repo := &fakeRepo{words: []Word{
		{Book: "John", Chapter: 3, Verse: 16, ParagraphID: 64003},
	}}
	svc := NewMorphgntService(repo)

	got, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.John, Chapter: 3, Verse: 16})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !repo.fetchCalled {
		t.Error("repo.FetchVerses was not called for NT reference")
	}
	if len(got.Paragraphs) != 1 || len(got.Paragraphs[0].Words) != 1 {
		t.Errorf("unexpected passage: %+v", got)
	}
}

// TestFetchVersesGroupsParagraphs verifies the service groups consecutive
// words with the same ParagraphID into a single Paragraph.
func TestFetchVersesGroupsParagraphs(t *testing.T) {
	words := []Word{
		{Book: "John", Chapter: 3, Verse: 16, WordIndex: 1, ParagraphID: 64003, Text: "a"},
		{Book: "John", Chapter: 3, Verse: 16, WordIndex: 2, ParagraphID: 64003, Text: "b"},
		{Book: "John", Chapter: 3, Verse: 17, WordIndex: 1, ParagraphID: 64004, Text: "c"},
		{Book: "John", Chapter: 3, Verse: 18, WordIndex: 1, ParagraphID: 64004, Text: "d"},
	}
	repo := &fakeRepo{words: words}
	svc := NewMorphgntService(repo)

	got, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.John, Chapter: 3, Verse: 16})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(got.Paragraphs) != 2 {
		t.Fatalf("paragraphs = %d, want 2; got %+v", len(got.Paragraphs), got.Paragraphs)
	}
	if got.Paragraphs[0].ID != 64003 || len(got.Paragraphs[0].Words) != 2 {
		t.Errorf("paragraph[0] = %+v, want id=64003 with 2 words", got.Paragraphs[0])
	}
	if got.Paragraphs[1].ID != 64004 || len(got.Paragraphs[1].Words) != 2 {
		t.Errorf("paragraph[1] = %+v, want id=64004 with 2 words", got.Paragraphs[1])
	}

	// Concatenated paragraph words must equal the input word sequence.
	var flat []Word
	for _, p := range got.Paragraphs {
		flat = append(flat, p.Words...)
	}
	if len(flat) != len(words) {
		t.Fatalf("flattened paragraphs = %d words, input = %d", len(flat), len(words))
	}
	for i := range flat {
		if flat[i].Text != words[i].Text {
			t.Errorf("position %d: paragraph word %q != input %q", i, flat[i].Text, words[i].Text)
		}
	}
}
