package sqlite_test

import (
	"path/filepath"
	"testing"

	"github.com/AndyHolt/darash/backend/internal/sqlite"
	"github.com/AndyHolt/darash/backend/internal/sqlite/sqlitetest"
)

// TestOpenIsReadOnly confirms the query_only pragma reaches the connection: a
// write through an Open handle is rejected, so the backend cannot mutate the
// baked corpus. Rejecting CREATE (rather than an INSERT into a seeded table)
// keeps the test self-contained — the point is that the write path is closed.
func TestOpenIsReadOnly(t *testing.T) {
	_, path := sqlitetest.New(t)

	db, err := sqlite.Open(path)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer func() { _ = db.Close() }()

	if _, err := db.Exec(`CREATE TABLE t (x INTEGER)`); err == nil {
		t.Fatal("write through read-only handle succeeded, want rejection")
	}
}

// TestOpenMissingFileFails confirms mode=ro turns a missing database file into a
// loud failure instead of silently creating an empty one. A read-write-create
// open would happily materialise an empty db here and serve an empty corpus.
func TestOpenMissingFileFails(t *testing.T) {
	path := filepath.Join(t.TempDir(), "does-not-exist.sqlite")

	if db, err := sqlite.Open(path); err == nil {
		_ = db.Close()
		t.Fatal("Open succeeded on a missing file, want failure")
	}
}
