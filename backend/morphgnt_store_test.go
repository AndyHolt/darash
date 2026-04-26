package main

import (
	"reflect"
	"regexp"
	"sort"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
)

// placeholderRE matches @name placeholders in SQL fragments.
var placeholderRE = regexp.MustCompile(`@([a-z_]+)`)

// placeholdersIn extracts the unique @name placeholders used in a SQL fragment.
func placeholdersIn(sql string) []string {
	matches := placeholderRE.FindAllStringSubmatch(sql, -1)
	seen := make(map[string]struct{}, len(matches))
	for _, m := range matches {
		seen[m[1]] = struct{}{}
	}
	out := make([]string, 0, len(seen))
	for k := range seen {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

func TestVersesFilterSingleVerse(t *testing.T) {
	where, args := versesFilter(VerseReference{John, 3, 16})

	wantArgs := pgx.NamedArgs{
		"book":    "John",
		"chapter": 3,
		"verse":   16,
	}
	if !reflect.DeepEqual(args, wantArgs) {
		t.Errorf("args = %+v, want %+v", args, wantArgs)
	}
	if !strings.Contains(where, "book = @book") ||
		!strings.Contains(where, "chapter = @chapter") ||
		!strings.Contains(where, "verse = @verse") {
		t.Errorf("where missing expected fragments: %q", where)
	}
}

func TestVersesFilterRangeSameChapter(t *testing.T) {
	ref := RangeReference{
		Start: VerseReference{Matthew, 12, 1},
		End:   VerseReference{Matthew, 12, 8},
	}
	where, args := versesFilter(ref)

	wantArgs := pgx.NamedArgs{
		"book":        "Matthew",
		"chapter":     12,
		"start_verse": 1,
		"end_verse":   8,
	}
	if !reflect.DeepEqual(args, wantArgs) {
		t.Errorf("args = %+v, want %+v", args, wantArgs)
	}
	if !strings.Contains(where, "BETWEEN @start_verse AND @end_verse") {
		t.Errorf("where missing BETWEEN fragment: %q", where)
	}
}

func TestVersesFilterRangeMultiChapter(t *testing.T) {
	ref := RangeReference{
		Start: VerseReference{John, 3, 16},
		End:   VerseReference{John, 4, 5},
	}
	where, args := versesFilter(ref)

	wantArgs := pgx.NamedArgs{
		"book":          "John",
		"start_chapter": 3,
		"start_verse":   16,
		"end_chapter":   4,
		"end_verse":     5,
	}
	if !reflect.DeepEqual(args, wantArgs) {
		t.Errorf("args = %+v, want %+v", args, wantArgs)
	}
	for _, frag := range []string{
		"chapter = @start_chapter",
		"chapter > @start_chapter",
		"chapter < @end_chapter",
		"chapter = @end_chapter",
		"verse >= @start_verse",
		"verse <= @end_verse",
	} {
		if !strings.Contains(where, frag) {
			t.Errorf("where missing fragment %q in %q", frag, where)
		}
	}
}

// TestVersesFilterPlaceholdersMatchArgs guards against typos: every @name in
// the WHERE fragment must have a matching key in NamedArgs, and vice versa.
// A mismatch would make pgx fail at runtime with "parameter not found" or
// silently leave a placeholder unbound — neither of which is reachable
// without a DB. This test catches both at unit-test time.
func TestVersesFilterPlaceholdersMatchArgs(t *testing.T) {
	tests := []struct {
		name string
		ref  Reference
	}{
		{"verse", VerseReference{John, 3, 16}},
		{"range same chapter", RangeReference{
			Start: VerseReference{Matthew, 12, 1},
			End:   VerseReference{Matthew, 12, 8},
		}},
		{"range multi chapter", RangeReference{
			Start: VerseReference{John, 3, 16},
			End:   VerseReference{John, 4, 5},
		}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			where, args := versesFilter(tt.ref)
			placeholders := placeholdersIn(where)

			argKeys := make([]string, 0, len(args))
			for k := range args {
				argKeys = append(argKeys, k)
			}
			sort.Strings(argKeys)

			if !reflect.DeepEqual(placeholders, argKeys) {
				t.Errorf("placeholders %v != args keys %v\nwhere: %s", placeholders, argKeys, where)
			}
		})
	}
}
