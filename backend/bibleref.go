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
		return RangeReference{Start: start, End: end}, nil
	default:
		return nil, fmt.Errorf("invalid reference string: %v", ref)
	}
}
