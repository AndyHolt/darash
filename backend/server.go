package main

import (
	"net/http"
)

type Server struct {
	morphgntHandler *MorphgntHandler
	tahotHandler    *TahotHandler
}

func NewServer(m *MorphgntService, t *TahotService) *Server {
	return &Server{
		morphgntHandler: &MorphgntHandler{service: m},
		tahotHandler:    &TahotHandler{service: t},
	}
}

func (s *Server) ListenAndServe(addr string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("GET /api/morphgnt/passage/{ref}", s.morphgntHandler.FetchVerses)
	mux.HandleFunc("GET /api/tahot/passage/{ref}", s.tahotHandler.FetchVerses)
	return http.ListenAndServe(addr, mux)
}
