package main

import (
	"fmt"
	"log"
	"net/http"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := fmt.Fprint(w, "Hello, from Darash!"); err != nil {
		log.Printf("write response: %v", err)
	}
}

func main() {
	http.HandleFunc("/", helloHandler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
