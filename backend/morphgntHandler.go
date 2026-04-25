package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type MorphgntHandler struct {
	service *MorphgntService
}

func (h *MorphgntHandler) Count(w http.ResponseWriter, r *http.Request) {
	count, err := h.service.Count(r.Context())
	if err != nil {
		log.Printf("count: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(count); err != nil {
		log.Printf("encode response: %v", err)
	}
}

func (h *MorphgntHandler) FetchVerses(w http.ResponseWriter, r *http.Request) {
	refstr := r.PathValue("ref")
	ref, err := ParseRefString(refstr)
	if err != nil {
		log.Printf("fetch verses reference parse error %q: %v", refstr, err)
		http.Error(w, "invalid passage reference", http.StatusBadRequest)
		return
	}

	passage, err := h.service.FetchVerses(r.Context(), ref)
	if err != nil {
		log.Printf("fetch verses error: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(passage); err != nil {
		log.Printf("encode response: %v", err)
	}
}
