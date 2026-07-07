package main

import (
	"encoding/json"
	"testing"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
)

func TestPassageMarshalJSON(t *testing.T) {
	p := Passage{
		Reference: ref.VerseReference{Book: ref.John, Chapter: 3, Verse: 16},
		Paragraphs: []Paragraph{
			{
				ID: 64003,
				Words: []Word{
					{Book: "John", Chapter: 3, Verse: 16, WordIndex: 1, ParagraphID: 64003, PartOfSpeech: PartOfSpeechAdverb,
						Text: "Οὕτως", TextWord: "Οὕτως", Normalized: "οὕτως", Lemma: "οὕτως"},
				},
			},
		},
	}
	got, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}

	var decoded struct {
		Reference  map[string]interface{} `json:"reference"`
		Paragraphs []struct {
			ID    int                      `json:"id"`
			Words []map[string]interface{} `json:"words"`
		} `json:"paragraphs"`
	}
	if err := json.Unmarshal(got, &decoded); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if decoded.Reference["kind"] != "verse" {
		t.Errorf("reference.kind = %v, want \"verse\"", decoded.Reference["kind"])
	}
	if len(decoded.Paragraphs) != 1 {
		t.Fatalf("got %d paragraphs, want 1", len(decoded.Paragraphs))
	}
	if decoded.Paragraphs[0].ID != 64003 {
		t.Errorf("paragraphs[0].id = %d, want 64003", decoded.Paragraphs[0].ID)
	}
	if len(decoded.Paragraphs[0].Words) != 1 {
		t.Fatalf("got %d words in paragraph, want 1", len(decoded.Paragraphs[0].Words))
	}
	if decoded.Paragraphs[0].Words[0]["book"] != "John" {
		t.Errorf("words[0].book = %v, want \"John\"", decoded.Paragraphs[0].Words[0]["book"])
	}
	// nullable morphology fields with omitempty should be absent
	if _, ok := decoded.Paragraphs[0].Words[0]["mood"]; ok {
		t.Errorf("nil Mood should be omitted, got %v", decoded.Paragraphs[0].Words[0]["mood"])
	}
}
