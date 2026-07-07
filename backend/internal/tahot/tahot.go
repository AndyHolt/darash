// Package tahot exposes the Hebrew Old Testament (TAHOT) corpus: its morphology
// types, the passage service, the Postgres-backed store, and the HTTP handler.
// The package name supplies the namespace, so the domain types are unprefixed
// (Word, Service, Handler, PartOfSpeech, …) even where they share a name with
// the Greek equivalents in package morphgnt.
package tahot

import (
	"fmt"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
)

// The morphology enums below mirror the TAHOT decoders in the ingest job
// (ingest/src/tahot/morphology.py) and follow the morphgnt package's idiom
// (typed string, Valid, Parse). The Hebrew value sets differ from the Greek
// (e.g. Gender adds common/both, Number adds dual). The ingest job maps each
// enum's "N/A" sentinel to SQL NULL, so on a loaded segment these fields are
// either a real value or absent — represented here as nil pointers rather than
// an N/A constant.

// SegmentKind classifies a segment as a morpheme position or punctuation.
type SegmentKind string

const (
	SegmentKindPrefix      SegmentKind = "prefix"
	SegmentKindRoot        SegmentKind = "root"
	SegmentKindSuffix      SegmentKind = "suffix"
	SegmentKindPunctuation SegmentKind = "punctuation"
)

func (k SegmentKind) Valid() bool {
	switch k {
	case SegmentKindPrefix, SegmentKindRoot,
		SegmentKindSuffix, SegmentKindPunctuation:
		return true
	}
	return false
}

func ParseSegmentKind(s string) (SegmentKind, error) {
	k := SegmentKind(s)
	if !k.Valid() {
		return "", fmt.Errorf("invalid segment kind %q", s)
	}
	return k, nil
}

// Language is the language a word is written in. A leading H/A on the
// word's first segment marks this and is implied for the rest of the word.
type Language string

const (
	LanguageHebrew  Language = "Hebrew"
	LanguageAramaic Language = "Aramaic"
)

func (l Language) Valid() bool {
	switch l {
	case LanguageHebrew, LanguageAramaic:
		return true
	}
	return false
}

func ParseLanguage(s string) (Language, error) {
	l := Language(s)
	if !l.Valid() {
		return "", fmt.Errorf("invalid language %q", s)
	}
	return l, nil
}

type PartOfSpeech string

const (
	PartOfSpeechAdjective             PartOfSpeech = "adjective"
	PartOfSpeechConjunction           PartOfSpeech = "conjunction"
	PartOfSpeechSequentialConjunction PartOfSpeech = "sequential conjunction"
	PartOfSpeechAdverb                PartOfSpeech = "adverb"
	PartOfSpeechNoun                  PartOfSpeech = "noun"
	PartOfSpeechPronoun               PartOfSpeech = "pronoun"
	PartOfSpeechPreposition           PartOfSpeech = "preposition"
	PartOfSpeechSuffix                PartOfSpeech = "suffix"
	PartOfSpeechParticle              PartOfSpeech = "particle"
	PartOfSpeechVerb                  PartOfSpeech = "verb"
)

func (p PartOfSpeech) Valid() bool {
	switch p {
	case PartOfSpeechAdjective, PartOfSpeechConjunction,
		PartOfSpeechSequentialConjunction, PartOfSpeechAdverb,
		PartOfSpeechNoun, PartOfSpeechPronoun,
		PartOfSpeechPreposition, PartOfSpeechSuffix,
		PartOfSpeechParticle, PartOfSpeechVerb:
		return true
	}
	return false
}

func ParsePartOfSpeech(s string) (PartOfSpeech, error) {
	p := PartOfSpeech(s)
	if !p.Valid() {
		return "", fmt.Errorf("invalid part of speech %q", s)
	}
	return p, nil
}

// Subtype is the POS-specific sub-classification label. It is a single
// field rather than one enum per part of speech because the same source letter
// means different things under different parts of speech; this is the closed
// union of labels the ingest job emits across every part of speech (the values
// of the per-POS lookup tables in morphology.py).
type Subtype string

const (
	// noun
	SubtypeCommon    Subtype = "common"
	SubtypeGentilic  Subtype = "gentilic"
	SubtypeNumerical Subtype = "numerical"
	SubtypeTitle     Subtype = "title"
	// proper noun
	SubtypeProperPersonMasculine Subtype = "proper name (person, masculine)"
	SubtypeProperPersonFeminine  Subtype = "proper name (person, feminine)"
	SubtypeProperLocation        Subtype = "proper name (location)"
	SubtypeProperTitle           Subtype = "proper name (title)"
	// adjective
	SubtypeAdjective      Subtype = "adjective"
	SubtypeCardinalNumber Subtype = "cardinal number"
	SubtypeOrdinalNumber  Subtype = "ordinal number"
	// pronoun
	SubtypeDemonstrative Subtype = "demonstrative"
	SubtypeInterrogative Subtype = "interrogative"
	SubtypePersonal      Subtype = "personal"
	SubtypeRelative      Subtype = "relative"
	// suffix
	SubtypeDirectionalHe Subtype = "directional he"
	SubtypeParagogicHe   Subtype = "paragogic he"
	SubtypeParagogicNun  Subtype = "paragogic nun"
	SubtypePronominal    Subtype = "pronominal"
	// particle
	SubtypeAffirmation            Subtype = "affirmation"
	SubtypeConditional            Subtype = "conditional"
	SubtypeDefiniteArticle        Subtype = "definite article"
	SubtypeAramaicArticle         Subtype = "Aramaic article"
	SubtypeInterjection           Subtype = "interjection"
	SubtypeNegative               Subtype = "negative"
	SubtypeObjectMarker           Subtype = "object marker"
	SubtypeConsequenceAffirmation Subtype = "consequence/affirmation"
	// preposition
	SubtypeWithArticle Subtype = "with article"
)

func (s Subtype) Valid() bool {
	switch s {
	case SubtypeCommon, SubtypeGentilic, SubtypeNumerical,
		SubtypeTitle, SubtypeProperPersonMasculine,
		SubtypeProperPersonFeminine, SubtypeProperLocation,
		SubtypeProperTitle, SubtypeAdjective, SubtypeCardinalNumber,
		SubtypeOrdinalNumber, SubtypeDemonstrative,
		SubtypeInterrogative, SubtypePersonal, SubtypeRelative,
		SubtypeDirectionalHe, SubtypeParagogicHe, SubtypeParagogicNun,
		SubtypePronominal, SubtypeAffirmation, SubtypeConditional,
		SubtypeDefiniteArticle, SubtypeAramaicArticle,
		SubtypeInterjection, SubtypeNegative, SubtypeObjectMarker,
		SubtypeConsequenceAffirmation, SubtypeWithArticle:
		return true
	}
	return false
}

func ParseSubtype(s string) (Subtype, error) {
	st := Subtype(s)
	if !st.Valid() {
		return "", fmt.Errorf("invalid subtype %q", s)
	}
	return st, nil
}

// VerbType is the conjugation/form of a verb. Its "N/A" sentinel is never
// stored (mapped to NULL at load), so it is absent on non-verb segments.
type VerbType string

const (
	VerbTypePerfect              VerbType = "perfect"
	VerbTypeSequentialPerfect    VerbType = "consecutive perfect"
	VerbTypeImperfect            VerbType = "imperfect"
	VerbTypeSequentialImperfect  VerbType = "consecutive imperfect"
	VerbTypeConjunctiveImperfect VerbType = "conjunctive imperfect"
	VerbTypeJussive              VerbType = "jussive"
	VerbTypeCohortative          VerbType = "cohortative"
	VerbTypeImperative           VerbType = "imperative"
	VerbTypeInfinitiveAbsolute   VerbType = "infinitive absolute"
	VerbTypeInfinitiveConstruct  VerbType = "infinitive construct"
	VerbTypeActiveParticiple     VerbType = "active participle"
	VerbTypePassiveParticiple    VerbType = "passive participle"
)

func (v VerbType) Valid() bool {
	switch v {
	case VerbTypePerfect, VerbTypeSequentialPerfect,
		VerbTypeImperfect, VerbTypeSequentialImperfect,
		VerbTypeConjunctiveImperfect, VerbTypeJussive,
		VerbTypeCohortative, VerbTypeImperative,
		VerbTypeInfinitiveAbsolute, VerbTypeInfinitiveConstruct,
		VerbTypeActiveParticiple, VerbTypePassiveParticiple:
		return true
	}
	return false
}

func ParseVerbType(s string) (VerbType, error) {
	v := VerbType(s)
	if !v.Valid() {
		return "", fmt.Errorf("invalid verb type %q", s)
	}
	return v, nil
}

// VerbStem is the decoded verb-stem label. The underlying codes are
// language-dependent (the same letter is a different stem in Hebrew vs Aramaic),
// but the decoded labels are flat; a few (pual, hithpael, hophal) occur in both
// languages. This is the closed union of values from the _VERB_STEMS table in
// morphology.py.
type VerbStem string

const (
	// Hebrew
	VerbStemQal        VerbStem = "qal"
	VerbStemNiphal     VerbStem = "niphal"
	VerbStemQalPassive VerbStem = "qal passive"
	VerbStemPiel       VerbStem = "piel"
	VerbStemPual       VerbStem = "pual"
	VerbStemPolal      VerbStem = "polal"
	VerbStemNithpael   VerbStem = "nithpael"
	VerbStemHothpaal   VerbStem = "hothpaal"
	VerbStemHithpael   VerbStem = "hithpael"
	VerbStemHiphil     VerbStem = "hiphil"
	VerbStemTiphil     VerbStem = "tiphil"
	VerbStemHophal     VerbStem = "hophal"
	VerbStemHishtaphel VerbStem = "hishtaphel"
	// Aramaic
	VerbStemPeal      VerbStem = "peal"
	VerbStemPeil      VerbStem = "peil"
	VerbStemPael      VerbStem = "pael"
	VerbStemHithpaal  VerbStem = "hithpaal"
	VerbStemItpeel    VerbStem = "itpeel"
	VerbStemHaphel    VerbStem = "haphel"
	VerbStemAphel     VerbStem = "aphel"
	VerbStemShaphel   VerbStem = "shaphel"
	VerbStemIshtaphel VerbStem = "ishtaphel"
)

func (s VerbStem) Valid() bool {
	switch s {
	case VerbStemQal, VerbStemNiphal, VerbStemQalPassive,
		VerbStemPiel, VerbStemPual, VerbStemPolal,
		VerbStemNithpael, VerbStemHothpaal, VerbStemHithpael,
		VerbStemHiphil, VerbStemTiphil, VerbStemHophal,
		VerbStemHishtaphel, VerbStemPeal, VerbStemPeil,
		VerbStemPael, VerbStemHithpaal, VerbStemItpeel,
		VerbStemHaphel, VerbStemAphel, VerbStemShaphel,
		VerbStemIshtaphel:
		return true
	}
	return false
}

func ParseVerbStem(s string) (VerbStem, error) {
	v := VerbStem(s)
	if !v.Valid() {
		return "", fmt.Errorf("invalid verb stem %q", s)
	}
	return v, nil
}

type Person string

const (
	PersonFirst  Person = "first"
	PersonSecond Person = "second"
	PersonThird  Person = "third"
)

func (p Person) Valid() bool {
	switch p {
	case PersonFirst, PersonSecond, PersonThird:
		return true
	}
	return false
}

func ParsePerson(s string) (Person, error) {
	p := Person(s)
	if !p.Valid() {
		return "", fmt.Errorf("invalid person %q", s)
	}
	return p, nil
}

// Gender includes common and both, which have no MorphGNT Greek analogue.
type Gender string

const (
	GenderMasculine Gender = "masculine"
	GenderFeminine  Gender = "feminine"
	GenderCommon    Gender = "common"
	GenderBoth      Gender = "both"
)

func (g Gender) Valid() bool {
	switch g {
	case GenderMasculine, GenderFeminine,
		GenderCommon, GenderBoth:
		return true
	}
	return false
}

func ParseGender(s string) (Gender, error) {
	g := Gender(s)
	if !g.Valid() {
		return "", fmt.Errorf("invalid gender %q", s)
	}
	return g, nil
}

// Number includes dual, which has no MorphGNT Greek analogue.
type Number string

const (
	NumberSingular Number = "singular"
	NumberPlural   Number = "plural"
	NumberDual     Number = "dual"
)

func (n Number) Valid() bool {
	switch n {
	case NumberSingular, NumberPlural, NumberDual:
		return true
	}
	return false
}

func ParseNumber(s string) (Number, error) {
	n := Number(s)
	if !n.Valid() {
		return "", fmt.Errorf("invalid number %q", s)
	}
	return n, nil
}

// State is the noun/adjective state (determined is the Aramaic analogue of
// the Hebrew definite article).
type State string

const (
	StateAbsolute   State = "absolute"
	StateConstruct  State = "construct"
	StateDetermined State = "determined"
)

func (s State) Valid() bool {
	switch s {
	case StateAbsolute, StateConstruct, StateDetermined:
		return true
	}
	return false
}

func ParseState(s string) (State, error) {
	st := State(s)
	if !st.Valid() {
		return "", fmt.Errorf("invalid state %q", s)
	}
	return st, nil
}

// FunctionMarker is the STEP trailing -o/-i/-r marker. Absent in the
// current TAHOT data, but decoded defensively.
type FunctionMarker string

const (
	FunctionMarkerObject         FunctionMarker = "object"
	FunctionMarkerIndirectObject FunctionMarker = "indirect object"
	FunctionMarkerRelated        FunctionMarker = "related"
)

func (f FunctionMarker) Valid() bool {
	switch f {
	case FunctionMarkerObject, FunctionMarkerIndirectObject,
		FunctionMarkerRelated:
		return true
	}
	return false
}

func ParseFunctionMarker(s string) (FunctionMarker, error) {
	f := FunctionMarker(s)
	if !f.Valid() {
		return "", fmt.Errorf("invalid function marker %q", s)
	}
	return f, nil
}

// WordSegment is one morpheme (prefix / root / suffix) or punctuation mark of
// a Hebrew word, with its disambiguated Strong's number and decoded morphology.
// Morphology fields are NULL for punctuation segments, so they are pointers.
// MorphCode stays a plain string: it is the raw ETCBC/STEP grammar code (e.g.
// "Ncfsa"), kept verbatim rather than decoded into a closed set.
type WordSegment struct {
	SegmentIndex    int             `json:"segment_index"             db:"segment_index"`
	Kind            SegmentKind     `json:"kind"                      db:"kind"`
	Hebrew          string          `json:"hebrew"                    db:"hebrew"`
	Transliteration *string         `json:"transliteration,omitempty" db:"transliteration"`
	Gloss           *string         `json:"gloss,omitempty"           db:"gloss"`
	Strong          *string         `json:"strong,omitempty"          db:"strong"`
	MorphCode       *string         `json:"morph_code,omitempty"      db:"morph_code"`
	Language        *Language       `json:"language,omitempty"        db:"language"`
	PartOfSpeech    *PartOfSpeech   `json:"part_of_speech,omitempty"  db:"part_of_speech"`
	Subtype         *Subtype        `json:"subtype,omitempty"         db:"subtype"`
	VerbStem        *VerbStem       `json:"verb_stem,omitempty"       db:"verb_stem"`
	VerbType        *VerbType       `json:"verb_type,omitempty"       db:"verb_type"`
	Person          *Person         `json:"person,omitempty"          db:"person"`
	Gender          *Gender         `json:"gender,omitempty"          db:"gender"`
	Number          *Number         `json:"number,omitempty"          db:"number"`
	State           *State          `json:"state,omitempty"           db:"state"`
	FunctionMarker  *FunctionMarker `json:"function_marker,omitempty" db:"function_marker"`
}

// Word is a single Hebrew word with its morpheme segments, variant
// metadata, and frequency stats.
type Word struct {
	Book              string        `json:"book"                 db:"book"`
	Chapter           int           `json:"chapter"              db:"chapter"`
	Verse             int           `json:"verse"                db:"verse"`
	WordIndex         string        `json:"word_index"           db:"word_index"`
	HebrewRef         *string       `json:"hebrew_ref,omitempty" db:"hebrew_ref"`
	TextType          string        `json:"text_type"            db:"text_type"`
	VariantMarkers    string        `json:"variant_markers"      db:"variant_markers"`
	HasMeaningVariant bool          `json:"has_meaning_variant"  db:"has_meaning_variant"`
	Hebrew            string        `json:"hebrew"               db:"hebrew"`
	Transliteration   string        `json:"transliteration"      db:"transliteration"`
	Translation       string        `json:"translation"          db:"translation"`
	Grammar           string        `json:"grammar"              db:"grammar"`
	MeaningVariants   string        `json:"meaning_variants"     db:"meaning_variants"`
	SpellingVariants  string        `json:"spelling_variants"    db:"spelling_variants"`
	RootStrong        *string       `json:"root_strong,omitempty"  db:"root_strong"`
	RootSstrong       *string       `json:"root_sstrong,omitempty" db:"root_sstrong"`
	AltStrongs        string        `json:"alt_strongs"          db:"alt_strongs"`
	ExpandedStrongs   string        `json:"expanded_strongs"     db:"expanded_strongs"`
	FormCount         int           `json:"form_count"           db:"form_count"`
	FormRank          int           `json:"form_rank"            db:"form_rank"`
	LemmaCount        int           `json:"lemma_count"          db:"lemma_count"`
	LemmaRank         int           `json:"lemma_rank"           db:"lemma_rank"`
	Segments          []WordSegment `json:"segments"             db:"segments"`
}

// Verse groups the words of a single verse. TAHOT has no paragraph
// structure, so the verse is the unit of grouping (unlike MorphGNT).
type Verse struct {
	Chapter int    `json:"chapter"`
	Verse   int    `json:"verse"`
	Words   []Word `json:"words"`
}

type Passage struct {
	Reference ref.Reference `json:"reference"`
	Verses    []Verse       `json:"verses"`
}
