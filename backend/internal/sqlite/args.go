package sqlite

import "database/sql"

// NamedArgs adapts the map[string]any returned by ref.VersesFilter into the
// variadic []any of sql.Named values that database/sql's QueryContext expects.
//
// ref.VersesFilter is deliberately kept free of any database or driver
// dependency: it returns the WHERE clause as a plain string and its arguments as
// a plain map, knowing nothing about database/sql or pgx. Converting that map
// into a specific driver's argument shape is the consumer's job — this is the
// SQLite consumer's converter, living in the persistence layer rather than in
// the domain ref package. (The pgx store did the equivalent inline with
// pgx.NamedArgs, which is itself a map type; database/sql instead wants a slice
// of sql.Named, so the conversion is a loop rather than a cast.)
//
// The @name placeholders VersesFilter emits need no rewriting: @ is a valid
// native SQLite bind-parameter prefix, and modernc.org/sqlite matches each
// sql.Named name to its @name in the query (comparing against the placeholder
// text with the leading @ stripped).
func NamedArgs(m map[string]any) []any {
	args := make([]any, 0, len(m))
	for name, value := range m {
		args = append(args, sql.Named(name, value))
	}
	return args
}
