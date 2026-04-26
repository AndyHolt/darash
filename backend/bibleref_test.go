package main

import (
	"testing"
)

func TestReferenceTestament(t *testing.T) {
	tests := []struct {
		name string
		ref  Reference
		want Testament
	}{
		{"OT verse", VerseReference{Genesis, 1, 1}, OldTestament},
		{"OT range", RangeReference{
			Start: VerseReference{Psalms, 1, 1},
			End:   VerseReference{Psalms, 1, 6},
		}, OldTestament},
		{"NT verse", VerseReference{John, 3, 16}, NewTestament},
		{"NT range", RangeReference{
			Start: VerseReference{Matthew, 12, 1},
			End:   VerseReference{Matthew, 12, 8},
		}, NewTestament},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.ref.Testament(); got != tt.want {
				t.Errorf("%s.Testament() = %d, want %d", tt.name, got, tt.want)
			}
		})
	}
}

func TestParseVerseReference(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    VerseReference
		wantErr bool
	}{
		{"valid", "Genesis.1.1", VerseReference{Genesis, 1, 1}, false},
		{"valid with abbrev", "Gen.1.1", VerseReference{Genesis, 1, 1}, false},
		{"numbered book", "1Sam.3.10", VerseReference{FirstSamuel, 3, 10}, false},
		{"last chapter and verse", "Genesis.50.26", VerseReference{Genesis, 50, 26}, false},
		{"single-chapter book", "Obadiah.1.21", VerseReference{Obadiah, 1, 21}, false},
		{"too few dots", "Genesis.1", VerseReference{}, true},
		{"too many dots", "Genesis.1.1.1", VerseReference{}, true},
		{"empty", "", VerseReference{}, true},
		{"unknown book", "Nonsense.1.1", VerseReference{}, true},
		{"non-numeric chapter", "Genesis.abc.1", VerseReference{}, true},
		{"non-numeric verse", "Genesis.1.abc", VerseReference{}, true},
		{"chapter zero", "Genesis.0.1", VerseReference{}, true},
		{"chapter negative", "Genesis.-1.1", VerseReference{}, true},
		{"chapter past last", "Genesis.51.1", VerseReference{}, true},
		{"chapter past last for short book", "Obadiah.2.1", VerseReference{}, true},
		{"verse zero", "Genesis.1.0", VerseReference{}, true},
		{"verse negative", "Genesis.1.-1", VerseReference{}, true},
		{"verse past last in chapter", "Genesis.1.32", VerseReference{}, true},
		{"verse one past last for last chapter", "Genesis.50.27", VerseReference{}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseVerseReference(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ParseVerseReference(%q) err = %v, wantErr = %v", tt.input, err, tt.wantErr)
			}
			if got != tt.want {
				t.Errorf("ParseVerseReference(%q) = %+v, want %+v", tt.input, got, tt.want)
			}
		})
	}
}

func TestNewRangeReference(t *testing.T) {
	tests := []struct {
		name    string
		start   VerseReference
		end     VerseReference
		wantErr bool
	}{
		{
			name:  "valid, spans chapters",
			start: VerseReference{Genesis, 1, 1},
			end:   VerseReference{Genesis, 2, 3},
		},
		{
			name:  "valid, same chapter",
			start: VerseReference{John, 3, 16},
			end:   VerseReference{John, 3, 17},
		},
		{
			name:    "different books",
			start:   VerseReference{Genesis, 50, 26},
			end:     VerseReference{Exodus, 1, 1},
			wantErr: true,
		},
		{
			name:    "descending chapters",
			start:   VerseReference{Genesis, 2, 1},
			end:     VerseReference{Genesis, 1, 1},
			wantErr: true,
		},
		{
			name:    "same verse",
			start:   VerseReference{John, 3, 16},
			end:     VerseReference{John, 3, 16},
			wantErr: true,
		},
		{
			name:    "descending verses in same chapter",
			start:   VerseReference{John, 3, 17},
			end:     VerseReference{John, 3, 16},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := NewRangeReference(tt.start, tt.end)
			if (err != nil) != tt.wantErr {
				t.Fatalf("NewRangeReference(%+v, %+v) err = %v, wantErr = %v", tt.start, tt.end, err, tt.wantErr)
			}
			if tt.wantErr {
				return
			}
			want := RangeReference{Start: tt.start, End: tt.end}
			if got != want {
				t.Errorf("got %+v, want %+v", got, want)
			}
		})
	}
}

func TestParseRefStringSingleVerse(t *testing.T) {
	ref, err := ParseRefString("John.3.16")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	v, ok := ref.(VerseReference)
	if !ok {
		t.Fatalf("ParseRefString returned %T, want VerseReference", ref)
	}
	want := VerseReference{John, 3, 16}
	if v != want {
		t.Errorf("got %+v, want %+v", v, want)
	}
}

func TestParseRefStringRange(t *testing.T) {
	ref, err := ParseRefString("John.3.16-John.3.17")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	r, ok := ref.(RangeReference)
	if !ok {
		t.Fatalf("ParseRefString returned %T, want RangeReference", ref)
	}
	want := RangeReference{
		Start: VerseReference{John, 3, 16},
		End:   VerseReference{John, 3, 17},
	}
	if r != want {
		t.Errorf("got %+v, want %+v", r, want)
	}
}

func TestParseRefStringErrors(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"empty", ""},
		{"too many dashes", "John.3.16-John.3.17-John.3.18"},
		{"bad verse", "John.3.xyz"},
		{"bad range start", "Nonsense.1.1-John.3.16"},
		{"bad range end", "John.3.16-Nonsense.1.1"},
		{"range crosses books", "Gen.50.26-Exod.1.1"},
		{"range descending", "John.3.17-John.3.16"},
		{"range same verse", "John.3.16-John.3.16"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ref, err := ParseRefString(tt.input)
			if err == nil {
				t.Errorf("ParseRefString(%q) = %+v, want error", tt.input, ref)
			}
			if ref != nil {
				t.Errorf("ParseRefString(%q) returned non-nil ref %+v on error path", tt.input, ref)
			}
		})
	}
}
