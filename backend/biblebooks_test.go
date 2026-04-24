package main

import "testing"

func TestAllReturns66BooksInOrder(t *testing.T) {
	all := All()
	if len(all) != 66 {
		t.Fatalf("All() returned %d books, want 66", len(all))
	}
	for i, b := range all {
		wantID := BookID(i + 1)
		if b.ID != wantID {
			t.Errorf("All()[%d].ID = %d, want %d", i, b.ID, wantID)
		}
	}
}

func TestBooksMapIntegrity(t *testing.T) {
	for id := Genesis; id <= Revelation; id++ {
		b, ok := books[id]
		if !ok {
			t.Errorf("books map missing entry for BookID %d", id)
			continue
		}
		if b.ID != id {
			t.Errorf("books[%d].ID = %d, mismatched", id, b.ID)
		}
		if b.Name == "" {
			t.Errorf("books[%d] has empty Name", id)
		}
		if b.Abbrev == "" {
			t.Errorf("books[%d] has empty Abbrev", id)
		}
		if len(b.Verses) == 0 {
			t.Errorf("books[%d] has no Verses", id)
		}
	}
}

func TestBookNamesAndAbbrevsAreUnique(t *testing.T) {
	seen := make(map[string]BookID)
	for id, b := range books {
		for _, key := range []string{b.Name, b.Abbrev} {
			if prev, dup := seen[key]; dup && prev != id {
				t.Errorf("duplicate Name/Abbrev %q shared by %d and %d", key, prev, id)
			}
			seen[key] = id
		}
	}
}

func TestLookup(t *testing.T) {
	b, ok := Lookup(Genesis)
	if !ok {
		t.Fatal("Lookup(Genesis) returned ok=false")
	}
	if b.Name != "Genesis" {
		t.Errorf("Lookup(Genesis).Name = %q, want %q", b.Name, "Genesis")
	}

	if _, ok := Lookup(BookID(0)); ok {
		t.Error("Lookup(0) returned ok=true, want false")
	}
	if _, ok := Lookup(BookID(999)); ok {
		t.Error("Lookup(999) returned ok=true, want false")
	}
}

func TestChapters(t *testing.T) {
	tests := []struct {
		id   BookID
		want int
	}{
		{Genesis, 50},
		{Psalms, 150},
		{Obadiah, 1},
		{Jude, 1},
		{Revelation, 22},
	}
	for _, tt := range tests {
		b, _ := Lookup(tt.id)
		if got := b.Chapters(); got != tt.want {
			t.Errorf("%s.Chapters() = %d, want %d", b.Name, got, tt.want)
		}
	}
}

func TestVersesInChapter(t *testing.T) {
	gen, _ := Lookup(Genesis)

	tests := []struct {
		name    string
		chapter int
		want    int
		wantErr bool
	}{
		{"first chapter", 1, 31, false},
		{"middle chapter", 25, 34, false},
		{"last chapter", 50, 26, false},
		{"zero", 0, 0, true},
		{"negative", -1, 0, true},
		{"one past last", 51, 0, true},
		{"far out of range", 1000, 0, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := gen.VersesInChapter(tt.chapter)
			if (err != nil) != tt.wantErr {
				t.Fatalf("Genesis.VersesInChapter(%d) err = %v, wantErr = %v", tt.chapter, err, tt.wantErr)
			}
			if got != tt.want {
				t.Errorf("Genesis.VersesInChapter(%d) = %d, want %d", tt.chapter, got, tt.want)
			}
		})
	}
}

func TestParseBookID(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    BookID
		wantErr bool
	}{
		{"full name", "Genesis", Genesis, false},
		{"abbrev", "Gen", Genesis, false},
		{"numbered full name", "1 Samuel", FirstSamuel, false},
		{"numbered abbrev", "1Sam", FirstSamuel, false},
		{"song of songs", "Song of Songs", SongOfSongs, false},
		{"song abbrev", "Song", SongOfSongs, false},
		{"revelation", "Revelation", Revelation, false},
		{"lowercase", "genesis", Genesis, false},
		{"uppercase", "GENESIS", Genesis, false},
		{"mixed case abbrev", "gEn", Genesis, false},
		{"lowercase numbered", "1sam", FirstSamuel, false},
		{"unknown", "Habakuk", 0, true},
		{"empty", "", 0, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseBookID(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ParseBookID(%q) err = %v, wantErr = %v", tt.input, err, tt.wantErr)
			}
			if got != tt.want {
				t.Errorf("ParseBookID(%q) = %d, want %d", tt.input, got, tt.want)
			}
		})
	}
}
