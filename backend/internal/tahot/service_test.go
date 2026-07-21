package tahot

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

func TestFetchVersesRejectsNewTestament(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo)

	_, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.John, Chapter: 3, Verse: 16})
	if !errors.Is(err, ErrNotOldTestament) {
		t.Fatalf("err = %v, want ErrNotOldTestament", err)
	}
	if repo.fetchCalled {
		t.Error("repo.FetchVerses was called for NT reference; should short-circuit in service")
	}
}

func TestFetchVersesEmptyResultReturnsError(t *testing.T) {
	repo := &fakeRepo{words: []Word{}}
	svc := NewService(repo)

	_, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.Genesis, Chapter: 1, Verse: 1})
	if !errors.Is(err, ref.ErrNoWordsFound) {
		t.Fatalf("err = %v, want ErrNoWordsFound", err)
	}
}

func TestFetchVersesAcceptsOldTestament(t *testing.T) {
	lex := &Lexicon{
		Hebrew: "רֵאשִׁית", Transliteration: "rešiyt", Morph: "HNf",
		Gloss: "beginning", Meaning: "the <i>first</i>, in place, time, order or rank",
		StrongRelation: "a Meaning of",
	}
	repo := &fakeRepo{words: []Word{
		{
			Book: "Genesis", Chapter: 1, Verse: 1,
			Segments: []WordSegment{
				{SegmentIndex: 0, Kind: SegmentKindRoot, Hebrew: "רֵאשִׁית", Lexicon: lex},
				{SegmentIndex: 1, Kind: SegmentKindPunctuation, Hebrew: "׃"},
			},
		},
	}}
	svc := NewService(repo)

	got, err := svc.FetchVerses(context.Background(), ref.VerseReference{Book: ref.Genesis, Chapter: 1, Verse: 1})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !repo.fetchCalled {
		t.Error("repo.FetchVerses was not called for OT reference")
	}
	if len(got.Verses) != 1 || len(got.Verses[0].Words) != 1 {
		t.Fatalf("unexpected passage: %+v", got)
	}

	// Grouping words into verses passes segments — and their lexicon entries —
	// through untouched, including the nil entry on a segment without one.
	segs := got.Verses[0].Words[0].Segments
	if len(segs) != 2 {
		t.Fatalf("segments = %d, want 2", len(segs))
	}
	if segs[0].Lexicon != lex {
		t.Errorf("segments[0].Lexicon = %+v, want the seeded entry", segs[0].Lexicon)
	}
	if segs[1].Lexicon != nil {
		t.Errorf("segments[1].Lexicon = %+v, want nil", *segs[1].Lexicon)
	}
}

// TestFetchVersesGroupsVerses verifies the service groups consecutive
// words with the same (Chapter, Verse) into a single Verse.
func TestFetchVersesGroupsVerses(t *testing.T) {
	words := []Word{
		{Book: "Genesis", Chapter: 1, Verse: 1, WordIndex: "01", Hebrew: "a"},
		{Book: "Genesis", Chapter: 1, Verse: 1, WordIndex: "02", Hebrew: "b"},
		{Book: "Genesis", Chapter: 1, Verse: 2, WordIndex: "01", Hebrew: "c"},
		{Book: "Genesis", Chapter: 2, Verse: 1, WordIndex: "01", Hebrew: "d"},
	}
	repo := &fakeRepo{words: words}
	svc := NewService(repo)

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
	var flat []Word
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
