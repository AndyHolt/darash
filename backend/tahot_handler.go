package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
)

type TahotHandler struct {
	service *TahotService
}

func (h *TahotHandler) FetchVerses(w http.ResponseWriter, r *http.Request) {
	refstr := r.PathValue("ref")
	reference, err := ref.ParseRefString(refstr)
	if err != nil {
		slog.Warn("fetch tahot verses reference parse error", "ref", refstr, "err", err)
		http.Error(w, "invalid passage reference", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	passage, err := h.service.FetchVerses(ctx, reference)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotOldTestament):
			http.Error(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, ref.ErrNoWordsFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		default:
			slog.Error("fetch tahot verses error", "ref", refstr, "err", err)
			http.Error(w, "internal error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(passage); err != nil {
		slog.Error("encode response", "err", err)
	}
}
