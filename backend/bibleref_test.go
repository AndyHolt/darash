package main

import "testing"

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
		{"too few dots", "Genesis.1", VerseReference{}, true},
		{"too many dots", "Genesis.1.1.1", VerseReference{}, true},
		{"empty", "", VerseReference{}, true},
		{"unknown book", "Nonsense.1.1", VerseReference{}, true},
		{"non-numeric chapter", "Genesis.abc.1", VerseReference{}, true},
		{"non-numeric verse", "Genesis.1.abc", VerseReference{}, true},
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
