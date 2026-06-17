package main

// TahotWordSegment is one morpheme (prefix / root / suffix) or punctuation mark of
// a Hebrew word, with its disambiguated Strong's number and decoded morphology.
// Morphology fields are NULL for punctuation segments, so they are pointers.
type TahotWordSegment struct {
	SegmentIndex    int     `json:"segment_index"             db:"segment_index"`
	Kind            string  `json:"kind"                      db:"kind"`
	Hebrew          string  `json:"hebrew"                    db:"hebrew"`
	Transliteration *string `json:"transliteration,omitempty" db:"transliteration"`
	Gloss           *string `json:"gloss,omitempty"           db:"gloss"`
	Strong          *string `json:"strong,omitempty"          db:"strong"`
	MorphCode       *string `json:"morph_code,omitempty"      db:"morph_code"`
	Language        *string `json:"language,omitempty"        db:"language"`
	PartOfSpeech    *string `json:"part_of_speech,omitempty"  db:"part_of_speech"`
	Subtype         *string `json:"subtype,omitempty"         db:"subtype"`
	VerbStem        *string `json:"verb_stem,omitempty"       db:"verb_stem"`
	VerbType        *string `json:"verb_type,omitempty"       db:"verb_type"`
	Person          *string `json:"person,omitempty"          db:"person"`
	Gender          *string `json:"gender,omitempty"          db:"gender"`
	Number          *string `json:"number,omitempty"          db:"number"`
	State           *string `json:"state,omitempty"           db:"state"`
	FunctionMarker  *string `json:"function_marker,omitempty" db:"function_marker"`
}

// TahotWord is a single Hebrew word with its morpheme segments, variant
// metadata, and frequency stats.
type TahotWord struct {
	Book              string             `json:"book"                 db:"book"`
	Chapter           int                `json:"chapter"              db:"chapter"`
	Verse             int                `json:"verse"                db:"verse"`
	WordIndex         string             `json:"word_index"           db:"word_index"`
	HebrewRef         *string            `json:"hebrew_ref,omitempty" db:"hebrew_ref"`
	TextType          string             `json:"text_type"            db:"text_type"`
	VariantMarkers    string             `json:"variant_markers"      db:"variant_markers"`
	HasMeaningVariant bool               `json:"has_meaning_variant"  db:"has_meaning_variant"`
	Hebrew            string             `json:"hebrew"               db:"hebrew"`
	Transliteration   string             `json:"transliteration"      db:"transliteration"`
	Translation       string             `json:"translation"          db:"translation"`
	Grammar           string             `json:"grammar"              db:"grammar"`
	MeaningVariants   string             `json:"meaning_variants"     db:"meaning_variants"`
	SpellingVariants  string             `json:"spelling_variants"    db:"spelling_variants"`
	RootStrong        *string            `json:"root_strong,omitempty"  db:"root_strong"`
	RootSstrong       *string            `json:"root_sstrong,omitempty" db:"root_sstrong"`
	AltStrongs        string             `json:"alt_strongs"          db:"alt_strongs"`
	ExpandedStrongs   string             `json:"expanded_strongs"     db:"expanded_strongs"`
	FormCount         int                `json:"form_count"           db:"form_count"`
	FormRank          int                `json:"form_rank"            db:"form_rank"`
	LemmaCount        int                `json:"lemma_count"          db:"lemma_count"`
	LemmaRank         int                `json:"lemma_rank"           db:"lemma_rank"`
	Segments          []TahotWordSegment `json:"segments"             db:"segments"`
}

// TahotVerse groups the words of a single verse. TAHOT has no paragraph
// structure, so the verse is the unit of grouping (unlike MorphGNT).
type TahotVerse struct {
	Chapter int         `json:"chapter"`
	Verse   int         `json:"verse"`
	Words   []TahotWord `json:"words"`
}

type TahotPassage struct {
	Reference Reference    `json:"reference"`
	Verses    []TahotVerse `json:"verses"`
}
