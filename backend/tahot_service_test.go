package main

import (
	"context"
	"errors"
	"testing"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
)

type fakeTahotRepo struct {
	fetchCalled bool
	words       []TahotWord
	err         error
}

func (f *fakeTahotRepo) FetchTahotVerses(_ context.Context, _ ref.Reference) ([]TahotWord, error) {
	f.fetchCalled = true
	return f.words, f.err
}

func TestTahotFetchVersesRejectsNewTestament(t *testing.T) {
	repo := &fakeTahotRepo{}
	svc := NewTahotService(repo)

	_, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.John, Chapter: 3, Verse: 16})
	if !errors.Is(err, ErrNotOldTestament) {
		t.Fatalf("err = %v, want ErrNotOldTestament", err)
	}
	if repo.fetchCalled {
		t.Error("repo.FetchTahotVerses was called for NT reference; should short-circuit in service")
	}
}

func TestTahotFetchVersesEmptyResultReturnsError(t *testing.T) {
	repo := &fakeTahotRepo{words: []TahotWord{}}
	svc := NewTahotService(repo)

	_, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.Genesis, Chapter: 1, Verse: 1})
	if !errors.Is(err, ref.ErrNoWordsFound) {
		t.Fatalf("err = %v, want ErrNoWordsFound", err)
	}
}

func TestTahotFetchVersesAcceptsOldTestament(t *testing.T) {
	repo := &fakeTahotRepo{words: []TahotWord{
		{Book: "Genesis", Chapter: 1, Verse: 1},
	}}
	svc := NewTahotService(repo)

	got, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.Genesis, Chapter: 1, Verse: 1})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !repo.fetchCalled {
		t.Error("repo.FetchTahotVerses was not called for OT reference")
	}
	if len(got.Verses) != 1 || len(got.Verses[0].Words) != 1 {
		t.Errorf("unexpected passage: %+v", got)
	}
}

// TestTahotFetchVersesGroupsVerses verifies the service groups consecutive
// words with the same (Chapter, Verse) into a single TahotVerse.
func TestTahotFetchVersesGroupsVerses(t *testing.T) {
	words := []TahotWord{
		{Book: "Genesis", Chapter: 1, Verse: 1, WordIndex: "01", Hebrew: "a"},
		{Book: "Genesis", Chapter: 1, Verse: 1, WordIndex: "02", Hebrew: "b"},
		{Book: "Genesis", Chapter: 1, Verse: 2, WordIndex: "01", Hebrew: "c"},
		{Book: "Genesis", Chapter: 2, Verse: 1, WordIndex: "01", Hebrew: "d"},
	}
	repo := &fakeTahotRepo{words: words}
	svc := NewTahotService(repo)

	got, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.Genesis, Chapter: 1, Verse: 1})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(got.Verses) != 3 {
		t.Fatalf("verses = %d, want 3; got %+v", len(got.Verses), got.Verses)
	}
	if got.Verses[0].Chapter != 1 || got.Verses[0].Verse != 1 || len(got.Verses[0].Words) != 2 {
		t.Errorf("verse[0] = %+v, want 1:1 with 2 words", got.Verses[0])
	}
	if got.Verses[1].Chapter != 1 || got.Verses[1].Verse != 2 || len(got.Verses[1].Words) != 1 {
		t.Errorf("verse[1] = %+v, want 1:2 with 1 word", got.Verses[1])
	}
	if got.Verses[2].Chapter != 2 || got.Verses[2].Verse != 1 || len(got.Verses[2].Words) != 1 {
		t.Errorf("verse[2] = %+v, want 2:1 with 1 word", got.Verses[2])
	}

	// Concatenated verse words must equal the input word sequence.
	var flat []TahotWord
	for _, v := range got.Verses {
		flat = append(flat, v.Words...)
	}
	if len(flat) != len(words) {
		t.Fatalf("flattened verses = %d words, input = %d", len(flat), len(words))
	}
	for i := range flat {
		if flat[i].Hebrew != words[i].Hebrew {
			t.Errorf("position %d: verse word %q != input %q", i, flat[i].Hebrew, words[i].Hebrew)
		}
	}
}
