package main

import (
	"fmt"
	"log"
	"net/http"
)

type Server struct {
	morphgntHandler *MorphgntHandler
}

func NewServer(s *MorphgntService) *Server {
	return &Server{
		morphgntHandler: &MorphgntHandler{service: s},
	}
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := fmt.Fprint(w, "Hello, from Darash!"); err != nil {
		log.Printf("write response: %v", err)
	}
}

func (s *Server) ListenAndServe(addr string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /count", s.morphgntHandler.Count)
	mux.HandleFunc("/", helloHandler)
	return http.ListenAndServe(addr, mux)
}
