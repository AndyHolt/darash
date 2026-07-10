package sqlite_test

import (
	"path/filepath"
	"testing"

	"github.com/AndyHolt/darash/backend/internal/sqlite"
)

// TestOpenIsReadOnly confirms the query_only pragma reaches the connection: a
// write through an Open handle is rejected, so the backend cannot mutate the
// baked corpus. Rejecting CREATE (rather than an INSERT into a seeded table)
// keeps the test self-contained — the point is that the write path is closed.
func TestOpenIsReadOnly(t *testing.T) {
	path := filepath.Join(t.TempDir(), "data.sqlite")

	db, err := sqlite.Open(path)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer func() { _ = db.Close() }()

	if _, err := db.Exec(`CREATE TABLE t (x INTEGER)`); err == nil {
		t.Fatal("write through read-only handle succeeded, want rejection")
	}
}
