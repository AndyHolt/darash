package main

import (
	"context"
	"errors"
	"testing"
)

type fakeRepo struct {
	fetchCalled bool
	passage     Passage
	err         error
}

func (f *fakeRepo) WordCount(_ context.Context) (WordCount, error) {
	return WordCount{}, nil
}

func (f *fakeRepo) FetchVerses(_ context.Context, ref Reference) (Passage, error) {
	f.fetchCalled = true
	return f.passage, f.err
}

func TestFetchVersesRejectsOldTestament(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewMorphgntService(repo)

	_, err := svc.FetchVerses(context.Background(), VerseReference{Genesis, 1, 1})
	if !errors.Is(err, ErrNotNewTestament) {
		t.Fatalf("err = %v, want ErrNotNewTestament", err)
	}
	if repo.fetchCalled {
		t.Error("repo.FetchVerses was called for OT reference; should short-circuit in service")
	}
}

func TestFetchVersesEmptyResultReturnsError(t *testing.T) {
	repo := &fakeRepo{passage: Passage{
		Reference: VerseReference{John, 3, 16},
		Words:     []Word{},
	}}
	svc := NewMorphgntService(repo)

	_, err := svc.FetchVerses(context.Background(), VerseReference{John, 3, 16})
	if !errors.Is(err, ErrNoWordsFound) {
		t.Fatalf("err = %v, want ErrNoWordsFound", err)
	}
}

func TestFetchVersesAcceptsNewTestament(t *testing.T) {
	want := Passage{
		Reference: VerseReference{John, 3, 16},
		Words:     []Word{{Book: "John", Chapter: 3, Verse: 16, ParagraphID: 64003}},
	}
	repo := &fakeRepo{passage: want}
	svc := NewMorphgntService(repo)

	got, err := svc.FetchVerses(context.Background(), VerseReference{John, 3, 16})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !repo.fetchCalled {
		t.Error("repo.FetchVerses was not called for NT reference")
	}
	if len(got.Words) != 1 || got.Words[0].Book != "John" {
		t.Errorf("unexpected passage: %+v", got)
	}
}

// TestFetchVersesGroupsParagraphs verifies the service groups consecutive
// words with the same ParagraphID into a Paragraph, and that the deprecated
// Words field is still populated identically.
func TestFetchVersesGroupsParagraphs(t *testing.T) {
	words := []Word{
		{Book: "John", Chapter: 3, Verse: 16, WordIndex: 1, ParagraphID: 64003, Text: "a"},
		{Book: "John", Chapter: 3, Verse: 16, WordIndex: 2, ParagraphID: 64003, Text: "b"},
		{Book: "John", Chapter: 3, Verse: 17, WordIndex: 1, ParagraphID: 64004, Text: "c"},
		{Book: "John", Chapter: 3, Verse: 18, WordIndex: 1, ParagraphID: 64004, Text: "d"},
	}
	repo := &fakeRepo{passage: Passage{
		Reference: VerseReference{John, 3, 16},
		Words:     words,
	}}
	svc := NewMorphgntService(repo)

	got, err := svc.FetchVerses(context.Background(), VerseReference{John, 3, 16})
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

	// Concatenated paragraph words must equal the deprecated Words field.
	var flat []Word
	for _, p := range got.Paragraphs {
		flat = append(flat, p.Words...)
	}
	if len(flat) != len(got.Words) {
		t.Fatalf("flattened paragraphs = %d words, Words = %d", len(flat), len(got.Words))
	}
	for i := range flat {
		if flat[i].Text != got.Words[i].Text {
			t.Errorf("position %d: paragraph word %q != Words %q", i, flat[i].Text, got.Words[i].Text)
		}
	}
}
