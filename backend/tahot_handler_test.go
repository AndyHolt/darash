package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// newTestTahotHandler wires a handler around a service backed by a fake repo.
func newTestTahotHandler(repo *fakeTahotRepo) *TahotHandler {
	return &TahotHandler{service: NewTahotService(repo)}
}

// fetchTahotVersesRequest builds a request with the {ref} path value populated,
// since we bypass the mux in handler tests.
func fetchTahotVersesRequest(ref string) *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/api/tahot/passage/"+ref, nil)
	req.SetPathValue("ref", ref)
	return req
}

func TestFetchTahotVersesHandlerSuccess(t *testing.T) {
	gloss := "in"
	repo := &fakeTahotRepo{words: []TahotWord{
		{
			Book: "Genesis", Chapter: 1, Verse: 1, WordIndex: "01",
			Hebrew: "בְּ/רֵאשִׁית", Translation: "in/ beginning",
			Segments: []TahotWordSegment{
				{SegmentIndex: 0, Kind: "prefix", Hebrew: "בְּ", Gloss: &gloss},
			},
		},
	}}
	h := newTestTahotHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchTahotVersesRequest("Gen.1.1"))

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", ct)
	}

	var decoded struct {
		Reference map[string]interface{} `json:"reference"`
		Verses    []struct {
			Chapter int                      `json:"chapter"`
			Verse   int                      `json:"verse"`
			Words   []map[string]interface{} `json:"words"`
		} `json:"verses"`
	}
	if err := json.NewDecoder(w.Body).Decode(&decoded); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if decoded.Reference["kind"] != "verse" {
		t.Errorf("reference.kind = %v, want \"verse\"", decoded.Reference["kind"])
	}
	if len(decoded.Verses) != 1 || len(decoded.Verses[0].Words) != 1 {
		t.Errorf("verses = %+v, want 1 verse with 1 word", decoded.Verses)
	}
	if segs, ok := decoded.Verses[0].Words[0]["segments"].([]interface{}); !ok || len(segs) != 1 {
		t.Errorf("word segments = %v, want 1 segment", decoded.Verses[0].Words[0]["segments"])
	}
}

func TestFetchTahotVersesHandlerInvalidReferenceReturns400(t *testing.T) {
	repo := &fakeTahotRepo{}
	h := newTestTahotHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchTahotVersesRequest("Nonsense.1.1"))

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400; body: %s", w.Code, w.Body.String())
	}
	if repo.fetchCalled {
		t.Error("repo.FetchTahotVerses called for unparseable reference")
	}
}

func TestFetchTahotVersesHandlerNewTestamentReturns400(t *testing.T) {
	repo := &fakeTahotRepo{}
	h := newTestTahotHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchTahotVersesRequest("John.1.1"))

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400; body: %s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), "Old Testament") {
		t.Errorf("body should mention Old Testament, got %q", w.Body.String())
	}
	if repo.fetchCalled {
		t.Error("repo.FetchTahotVerses called for NT reference")
	}
}

func TestFetchTahotVersesHandlerNoWordsReturns404(t *testing.T) {
	repo := &fakeTahotRepo{words: []TahotWord{}}
	h := newTestTahotHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchTahotVersesRequest("Gen.1.1"))

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404; body: %s", w.Code, w.Body.String())
	}
}

func TestFetchTahotVersesHandlerRepoErrorReturns500(t *testing.T) {
	repo := &fakeTahotRepo{err: errors.New("db connection lost")}
	h := newTestTahotHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchTahotVersesRequest("Gen.1.1"))

	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500; body: %s", w.Code, w.Body.String())
	}
	// internal error message should not leak the underlying cause to the client
	if strings.Contains(w.Body.String(), "db connection lost") {
		t.Errorf("underlying error leaked to client: %q", w.Body.String())
	}
}
