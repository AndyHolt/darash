package main

import (
	"log/slog"
	"net/http"
	"runtime/debug"
	"time"
)

// statusRecorder wraps http.ResponseWriter to capture the status code written
// by a handler, so it can be logged once the request completes.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// recoverPanic recovers from a panic in a downstream handler, logs the stack,
// and responds with 500 rather than letting the connection drop silently.
func recoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("panic recovered",
					"err", err,
					"method", r.Method,
					"path", r.URL.Path,
					"stack", string(debug.Stack()),
				)
				http.Error(w, "internal error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// logRequests logs one structured line per request with method, path, status
// and duration. Health-check probes are logged at DEBUG so they can be filtered
// out in production (which polls /health frequently) while remaining visible
// when the log level is lowered.
func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)

		level := slog.LevelInfo
		if r.URL.Path == "/health" {
			level = slog.LevelDebug
		}
		slog.LogAttrs(r.Context(), level, "request",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", rec.status),
			slog.Duration("duration", time.Since(start)),
		)
	})
}
