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
		Words:     []Word{{Book: "John", Chapter: 3, Verse: 16}},
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
