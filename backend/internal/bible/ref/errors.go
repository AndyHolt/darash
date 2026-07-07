package ref

import "errors"

// ErrNoWordsFound is returned when a well-formed reference resolves to no words
// in the underlying corpus. It is shared across corpora (MorphGNT, TAHOT) so it
// lives with the reference domain rather than in any single corpus package.
var ErrNoWordsFound = errors.New("no words found for reference")
