package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
)

type VerseReference struct {
	Book    BookID `json:"book"`
	Chapter int    `json:"chapter"`
	Verse   int    `json:"verse"`
}

type RangeReference struct {
	Start VerseReference `json:"start"`
	End   VerseReference `json:"end"`
}

// sealed interface for single verse and range references
type Reference interface {
	isReference()
}

func (VerseReference) isReference() {}
func (RangeReference) isReference() {}

func (v VerseReference) MarshalJSON() ([]byte, error) {
	type alias VerseReference
	return json.Marshal(struct {
		Kind string `json:"kind"`
		alias
	}{"verse", alias(v)})
}

func (r RangeReference) MarshalJSON() ([]byte, error) {
	type alias VerseReference
	return json.Marshal(struct {
		Kind  string `json:"kind"`
		Start alias  `json:"start"`
		End   alias  `json:"end"`
	}{"range", alias(r.Start), alias(r.End)})
}

func ParseVerseReference(ref string) (VerseReference, error) {
	elements := strings.Split(ref, ".")

	if len(elements) != 3 {
		return VerseReference{}, fmt.Errorf("invalid reference, should have three dot-separated values: %q", ref)
	}

	bookID, err := ParseBookID(elements[0])
	if err != nil {
		return VerseReference{}, fmt.Errorf("invalid book in ref string %q: %w", ref, err)
	}
	book, ok := Lookup(bookID)
	if !ok {
		return VerseReference{}, fmt.Errorf("could not get book details for bookID %v", bookID)
	}

	chapter, err := strconv.Atoi(elements[1])
	if err != nil {
		return VerseReference{}, fmt.Errorf("invalid chapter in ref string %q: %w", ref, err)
	}
	if chapter <= 0 || chapter > book.Chapters() {
		return VerseReference{}, fmt.Errorf("chapter %d not available for book %v (%d chapters)", chapter, book.Name, book.Chapters())
	}

	verse, err := strconv.Atoi(elements[2])
	if err != nil {
		return VerseReference{}, fmt.Errorf("invalid verse in ref string %q: %w", ref, err)
	}
	if verse <= 0 || verse > book.Verses[chapter-1] {
		return VerseReference{}, fmt.Errorf("invalid verse number %d (%v %d has %d verses)", verse, book.Name, chapter, book.Verses[chapter-1])
	}

	return VerseReference{
		Book:    bookID,
		Chapter: chapter,
		Verse:   verse,
	}, nil
}

func NewRangeReference(start, end VerseReference) (RangeReference, error) {
	if start.Book != end.Book {
		return RangeReference{}, fmt.Errorf("reference range must be within a single book: starts in %v but ends in %v", start.Book, end.Book)
	}
	if end.Chapter < start.Chapter || (end.Chapter == start.Chapter && end.Verse <= start.Verse) {
		return RangeReference{}, fmt.Errorf("range must be ascending: start %d:%d is not before end %d:%d", start.Chapter, start.Verse, end.Chapter, end.Verse)
	}
	return RangeReference{Start: start, End: end}, nil
}

func ParseRefString(ref string) (Reference, error) {
	refs := strings.Split(ref, "-")

	switch len(refs) {
	case 1:
		v, err := ParseVerseReference(refs[0])
		if err != nil {
			return nil, fmt.Errorf("parse reference %q: %w", ref, err)
		}
		return v, nil
	case 2:
		start, err := ParseVerseReference(refs[0])
		if err != nil {
			return nil, fmt.Errorf("parse range start %q: %w", ref, err)
		}
		end, err := ParseVerseReference(refs[1])
		if err != nil {
			return nil, fmt.Errorf("parse range end %q: %w", ref, err)
		}
		rangeref, err := NewRangeReference(start, end)
		if err != nil {
			return nil, fmt.Errorf("parse range error %q: %w", ref, err)
		}
		return rangeref, nil
	default:
		return nil, fmt.Errorf("invalid reference string: %v", ref)
	}
}
