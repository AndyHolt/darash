// Package sqlite opens the read-only SQLite database the backend serves from.
// The corpus is static, read-only source data, so a file the process mmaps is
// enough — there is no connection string, TLS, or auth to manage.
//
// The database is a data.sqlite file (baked into the deployment image in prod,
// produced by `make ingest-run` locally). Its schema is owned by ingest; this
// package only reads it. The corpus stores query the *sql.DB returned here.
package sqlite

import (
	"database/sql"
	"fmt"
	"net/url"

	_ "modernc.org/sqlite" // registers the pure-Go "sqlite" driver
)

// mmapBytes is the PRAGMA mmap_size ceiling. SQLite mmaps up to this many bytes
// of the database file, so a reference lookup faults in only the pages it
// touches from the OS page cache instead of read()-ing them. 256 MiB
// comfortably covers the whole corpus with room to grow.
const mmapBytes = 256 << 20

// Open opens the SQLite database at path for read-only serving and verifies it
// is reachable. The returned *sql.DB is a connection pool the caller owns and
// must Close.
//
// The pragmas are set through the DSN so every connection the pool opens gets
// them: query_only rejects any write (the backend must never mutate the baked
// corpus), and mmap_size enables memory-mapped reads.
func Open(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dsn(path))
	if err != nil {
		return nil, fmt.Errorf("open sqlite %q: %w", path, err)
	}
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping sqlite %q: %w", path, err)
	}
	return db, nil
}

// dsn builds the modernc.org/sqlite DSN, encoding the per-connection pragmas as
// _pragma query parameters.
//
// mode=ro opens the file with SQLITE_OPEN_READONLY (no CREATE): the baked corpus
// is read-only, so a missing or unreadable file must fail loudly rather than
// have SQLite silently create an empty database in its place. This complements
// query_only(1), which rejects writes at the SQL layer.
func dsn(path string) string {
	q := url.Values{}
	q.Set("mode", "ro")
	q.Add("_pragma", "query_only(1)")
	q.Add("_pragma", fmt.Sprintf("mmap_size(%d)", mmapBytes))
	return "file:" + path + "?" + q.Encode()
}
