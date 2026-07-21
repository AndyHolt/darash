package tahot

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// newTestHandler wires a handler around a service backed by a fake repo.
func newTestHandler(repo *fakeRepo) *Handler {
	return &Handler{service: NewService(repo)}
}

// fetchVersesRequest builds a request with the {ref} path value populated,
// since we bypass the mux in handler tests.
func fetchVersesRequest(ref string) *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/api/tahot/passage/"+ref, nil)
	req.SetPathValue("ref", ref)
	return req
}

func TestFetchVersesHandlerSuccess(t *testing.T) {
	prefixGloss, rootGloss := "in", "beginning"
	repo := &fakeRepo{words: []Word{
		{
			Book: "Genesis", Chapter: 1, Verse: 1, WordIndex: "01",
			Hebrew: "בְּ/רֵאשִׁית", Translation: "in/ beginning",
			Segments: []WordSegment{
				{SegmentIndex: 0, Kind: SegmentKindPrefix, Hebrew: "בְּ", Gloss: &prefixGloss},
				{
					SegmentIndex: 1, Kind: SegmentKindRoot, Hebrew: "רֵאשִׁית", Gloss: &rootGloss,
					Lexicon: &Lexicon{
						Hebrew: "רֵאשִׁית", Transliteration: "rešiyt", Morph: "HNf",
						Gloss: "beginning", Meaning: "the <i>first</i>, in place, time, order or rank",
						StrongRelation: "a Meaning of",
					},
				},
			},
		},
	}}
	h := newTestHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchVersesRequest("Gen.1.1"))

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
	segs, ok := decoded.Verses[0].Words[0]["segments"].([]interface{})
	if !ok || len(segs) != 2 {
		t.Fatalf("word segments = %v, want 2 segments", decoded.Verses[0].Words[0]["segments"])
	}

	// The lexicon entry survives the service and handler unchanged, and is
	// serialised as a nested object rather than a string or an array.
	root, ok := segs[1].(map[string]interface{})
	if !ok {
		t.Fatalf("segments[1] = %v, want an object", segs[1])
	}
	lex, ok := root["lexicon"].(map[string]interface{})
	if !ok {
		t.Fatalf("segments[1].lexicon = %v, want an object", root["lexicon"])
	}
	for key, want := range map[string]string{
		"hebrew":          "רֵאשִׁית",
		"transliteration": "rešiyt",
		"morph":           "HNf",
		"gloss":           "beginning",
		"meaning":         "the <i>first</i>, in place, time, order or rank",
		"strong_relation": "a Meaning of",
	} {
		if lex[key] != want {
			t.Errorf("lexicon.%s = %v, want %q", key, lex[key], want)
		}
	}

	// A segment with no entry omits the key entirely (omitempty on a nil
	// pointer), rather than emitting "lexicon": null.
	prefix, ok := segs[0].(map[string]interface{})
	if !ok {
		t.Fatalf("segments[0] = %v, want an object", segs[0])
	}
	if _, present := prefix["lexicon"]; present {
		t.Errorf("segments[0] has a lexicon key (%v), want it omitted", prefix["lexicon"])
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

func TestFetchVersesHandlerNewTestamentReturns400(t *testing.T) {
	repo := &fakeRepo{}
	h := newTestHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchVersesRequest("John.1.1"))

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400; body: %s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), "Old Testament") {
		t.Errorf("body should mention Old Testament, got %q", w.Body.String())
	}
	if repo.fetchCalled {
		t.Error("repo.FetchVerses called for NT reference")
	}
}

func TestFetchVersesHandlerNoWordsReturns404(t *testing.T) {
	repo := &fakeRepo{words: []Word{}}
	h := newTestHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchVersesRequest("Gen.1.1"))

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404; body: %s", w.Code, w.Body.String())
	}
}

func TestFetchVersesHandlerRepoErrorReturns500(t *testing.T) {
	repo := &fakeRepo{err: errors.New("db connection lost")}
	h := newTestHandler(repo)

	w := httptest.NewRecorder()
	h.FetchVerses(w, fetchVersesRequest("Gen.1.1"))

	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500; body: %s", w.Code, w.Body.String())
	}
	// internal error message should not leak the underlying cause to the client
	if strings.Contains(w.Body.String(), "db connection lost") {
		t.Errorf("underlying error leaked to client: %q", w.Body.String())
	}
}
