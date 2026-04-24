package main

import (
	"fmt"
	"strconv"
	"strings"
)

type VerseReference struct {
	Book    BookID
	Chapter int
	Verse   int
}

type RangeReference struct {
	Start VerseReference
	End   VerseReference
}

// sealed interface for single verse and range references
type Reference interface {
	isReference()
}

func (VerseReference) isReference() {}
func (RangeReference) isReference() {}

func ParseVerseReference(ref string) (VerseReference, error) {
	elements := strings.Split(ref, ".")

	if len(elements) != 3 {
		return VerseReference{}, fmt.Errorf("invalid reference, should have three dot-separated values: %q", ref)
	}

	book, err := ParseBookID(elements[0])
	if err != nil {
		return VerseReference{}, fmt.Errorf("invalid book in ref string %q: %w", ref, err)
	}
	chapter, err := strconv.Atoi(elements[1])
	if err != nil {
		return VerseReference{}, fmt.Errorf("invalid chapter in ref string %q: %w", ref, err)
	}
	verse, err := strconv.Atoi(elements[2])
	if err != nil {
		return VerseReference{}, fmt.Errorf("invalid verse in ref string %q: %w", ref, err)
	}

	return VerseReference{
		Book:    book,
		Chapter: chapter,
		Verse:   verse,
	}, nil
}

func NewRangeReference(start, end VerseReference) (RangeReference, error) {
	if start.Book != end.Book {
		return RangeReference{}, fmt.Errorf("reference range must be within a single book: starts in %v but ends in %v", start.Book, end.Book)
	}
	if end.Chapter < start.Chapter || (end.Chapter == start.Chapter && end.Verse <= start.Verse) {
		return RangeReference{}, fmt.Errorf("end of range must be before beginning: start %d:%d is after end %d:%d", start.Chapter, start.Verse, end.Chapter, end.Verse)
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
