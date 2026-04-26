package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// newTestHandler wires a handler around a service backed by a fake repo.
func newTestHandler(repo *fakeRepo) *MorphgntHandler {
	return &MorphgntHandler{service: NewMorphgntService(repo)}
}

// fetchVersesRequest builds a request with the {ref} path value populated,
// since we bypass the mux in handler tests.
func fetchVersesRequest(ref string) *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/api/morphgnt/passage/"+ref, nil)
	req.SetPathValue("ref", ref)
	return req
}

func TestFetchVersesHandlerSuccess(t *testing.T) {
	repo := &fakeRepo{passage: Passage{
		Reference: VerseReference{John, 3, 16},
		Words: []Word{
			{Book: "John", Chapter: 3, Verse: 16, WordIndex: 1, PartOfSpeech: PartOfSpeechAdverb,
				Text: "Οὕτως", TextWord: "Οὕτως", Normalized: "οὕτως", Lemma: "οὕτως"},
		},
	}}
	h := newTestHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchVersesRequest("John.3.16"))

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", ct)
	}

	var decoded struct {
		Reference map[string]interface{}   `json:"reference"`
		Words     []map[string]interface{} `json:"words"`
	}
	if err := json.NewDecoder(w.Body).Decode(&decoded); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if decoded.Reference["kind"] != "verse" {
		t.Errorf("reference.kind = %v, want \"verse\"", decoded.Reference["kind"])
	}
}

func TestFetchVersesHandlerInvalidReferenceReturns400(t *testing.T) {
	repo := &fakeRepo{}
	h := newTestHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchVersesRequest("Nonsense.1.1"))

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400; body: %s", w.Code, w.Body.String())
	}
	if repo.fetchCalled {
		t.Error("repo.FetchVerses called for unparseable reference")
	}
}

func TestFetchVersesHandlerOldTestamentReturns400(t *testing.T) {
	repo := &fakeRepo{}
	h := newTestHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchVersesRequest("Genesis.1.1"))

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400; body: %s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), "New Testament") {
		t.Errorf("body should mention New Testament, got %q", w.Body.String())
	}
	if repo.fetchCalled {
		t.Error("repo.FetchVerses called for OT reference")
	}
}

func TestFetchVersesHandlerNoWordsReturns404(t *testing.T) {
	repo := &fakeRepo{passage: Passage{
		Reference: VerseReference{John, 3, 16},
		Words:     []Word{},
	}}
	h := newTestHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchVersesRequest("John.3.16"))

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404; body: %s", w.Code, w.Body.String())
	}
}

func TestFetchVersesHandlerRepoErrorReturns500(t *testing.T) {
	repo := &fakeRepo{err: errors.New("db connection lost")}
	h := newTestHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchVersesRequest("John.3.16"))

	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500; body: %s", w.Code, w.Body.String())
	}
	// internal error message should not leak the underlying cause to the client
	if strings.Contains(w.Body.String(), "db connection lost") {
		t.Errorf("underlying error leaked to client: %q", w.Body.String())
	}
}
