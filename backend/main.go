package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := fmt.Fprint(w, "Hello, from Darash!"); err != nil {
		log.Printf("write response: %v", err)
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/", helloHandler)

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
