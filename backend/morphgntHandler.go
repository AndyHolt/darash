package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type MorphgntHandler struct {
	service *MorphgntService
}

func (h MorphgntHandler) Count(w http.ResponseWriter, r *http.Request) {
	count, err := h.service.Count(r.Context())
	if err != nil {
		log.Printf("count: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(count); err != nil {
		log.Printf("encode response: %v", err)
	}
}
