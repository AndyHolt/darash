package main

import "fmt"

// The morphology enums below mirror the TAHOT decoders in the ingest job
// (ingest/src/tahot/morphology.py) and follow the morphgnt.go idiom (typed
// string, Valid, Parse). They are prefixed with Tahot because several names
// (PartOfSpeech, Person, Gender, Number) already exist for MorphGNT Greek in
// this package and the Hebrew value sets differ (e.g. Gender adds common/both,
// Number adds dual). The ingest job maps each enum's "N/A" sentinel to SQL
// NULL, so on a loaded segment these fields are either a real value or absent —
// represented here as nil pointers rather than an N/A constant.

// TahotSegmentKind classifies a segment as a morpheme position or punctuation.
type TahotSegmentKind string

const (
	TahotSegmentKindPrefix      TahotSegmentKind = "prefix"
	TahotSegmentKindRoot        TahotSegmentKind = "root"
	TahotSegmentKindSuffix      TahotSegmentKind = "suffix"
	TahotSegmentKindPunctuation TahotSegmentKind = "punctuation"
)

func (k TahotSegmentKind) Valid() bool {
	switch k {
	case TahotSegmentKindPrefix, TahotSegmentKindRoot,
		TahotSegmentKindSuffix, TahotSegmentKindPunctuation:
		return true
	}
	return false
}

func ParseTahotSegmentKind(s string) (TahotSegmentKind, error) {
	k := TahotSegmentKind(s)
	if !k.Valid() {
		return "", fmt.Errorf("invalid segment kind %q", s)
	}
	return k, nil
}

// TahotLanguage is the language a word is written in. A leading H/A on the
// word's first segment marks this and is implied for the rest of the word.
type TahotLanguage string

const (
	TahotLanguageHebrew  TahotLanguage = "Hebrew"
	TahotLanguageAramaic TahotLanguage = "Aramaic"
)

func (l TahotLanguage) Valid() bool {
	switch l {
	case TahotLanguageHebrew, TahotLanguageAramaic:
		return true
	}
	return false
}

func ParseTahotLanguage(s string) (TahotLanguage, error) {
	l := TahotLanguage(s)
	if !l.Valid() {
		return "", fmt.Errorf("invalid language %q", s)
	}
	return l, nil
}

type TahotPartOfSpeech string

const (
	TahotPartOfSpeechAdjective             TahotPartOfSpeech = "adjective"
	TahotPartOfSpeechConjunction           TahotPartOfSpeech = "conjunction"
	TahotPartOfSpeechSequentialConjunction TahotPartOfSpeech = "sequential conjunction"
	TahotPartOfSpeechAdverb                TahotPartOfSpeech = "adverb"
	TahotPartOfSpeechNoun                  TahotPartOfSpeech = "noun"
	TahotPartOfSpeechPronoun               TahotPartOfSpeech = "pronoun"
	TahotPartOfSpeechPreposition           TahotPartOfSpeech = "preposition"
	TahotPartOfSpeechSuffix                TahotPartOfSpeech = "suffix"
	TahotPartOfSpeechParticle              TahotPartOfSpeech = "particle"
	TahotPartOfSpeechVerb                  TahotPartOfSpeech = "verb"
)

func (p TahotPartOfSpeech) Valid() bool {
	switch p {
	case TahotPartOfSpeechAdjective, TahotPartOfSpeechConjunction,
		TahotPartOfSpeechSequentialConjunction, TahotPartOfSpeechAdverb,
		TahotPartOfSpeechNoun, TahotPartOfSpeechPronoun,
		TahotPartOfSpeechPreposition, TahotPartOfSpeechSuffix,
		TahotPartOfSpeechParticle, TahotPartOfSpeechVerb:
		return true
	}
	return false
}

func ParseTahotPartOfSpeech(s string) (TahotPartOfSpeech, error) {
	p := TahotPartOfSpeech(s)
	if !p.Valid() {
		return "", fmt.Errorf("invalid part of speech %q", s)
	}
	return p, nil
}

// TahotSubtype is the POS-specific sub-classification label. It is a single
// field rather than one enum per part of speech because the same source letter
// means different things under different parts of speech; this is the closed
// union of labels the ingest job emits across every part of speech (the values
// of the per-POS lookup tables in morphology.py).
type TahotSubtype string

const (
	// noun
	TahotSubtypeCommon    TahotSubtype = "common"
	TahotSubtypeGentilic  TahotSubtype = "gentilic"
	TahotSubtypeNumerical TahotSubtype = "numerical"
	TahotSubtypeTitle     TahotSubtype = "title"
	// proper noun
	TahotSubtypeProperPersonMasculine TahotSubtype = "proper name (person, masculine)"
	TahotSubtypeProperPersonFeminine  TahotSubtype = "proper name (person, feminine)"
	TahotSubtypeProperLocation        TahotSubtype = "proper name (location)"
	TahotSubtypeProperTitle           TahotSubtype = "proper name (title)"
	// adjective
	TahotSubtypeAdjective      TahotSubtype = "adjective"
	TahotSubtypeCardinalNumber TahotSubtype = "cardinal number"
	TahotSubtypeOrdinalNumber  TahotSubtype = "ordinal number"
	// pronoun
	TahotSubtypeDemonstrative TahotSubtype = "demonstrative"
	TahotSubtypeInterrogative TahotSubtype = "interrogative"
	TahotSubtypePersonal      TahotSubtype = "personal"
	TahotSubtypeRelative      TahotSubtype = "relative"
	// suffix
	TahotSubtypeDirectionalHe TahotSubtype = "directional he"
	TahotSubtypeParagogicHe   TahotSubtype = "paragogic he"
	TahotSubtypeParagogicNun  TahotSubtype = "paragogic nun"
	TahotSubtypePronominal    TahotSubtype = "pronominal"
	// particle
	TahotSubtypeAffirmation            TahotSubtype = "affirmation"
	TahotSubtypeConditional            TahotSubtype = "conditional"
	TahotSubtypeDefiniteArticle        TahotSubtype = "definite article"
	TahotSubtypeAramaicArticle         TahotSubtype = "Aramaic article"
	TahotSubtypeInterjection           TahotSubtype = "interjection"
	TahotSubtypeNegative               TahotSubtype = "negative"
	TahotSubtypeObjectMarker           TahotSubtype = "object marker"
	TahotSubtypeConsequenceAffirmation TahotSubtype = "consequence/affirmation"
	// preposition
	TahotSubtypeWithArticle TahotSubtype = "with article"
)

func (s TahotSubtype) Valid() bool {
	switch s {
	case TahotSubtypeCommon, TahotSubtypeGentilic, TahotSubtypeNumerical,
		TahotSubtypeTitle, TahotSubtypeProperPersonMasculine,
		TahotSubtypeProperPersonFeminine, TahotSubtypeProperLocation,
		TahotSubtypeProperTitle, TahotSubtypeAdjective, TahotSubtypeCardinalNumber,
		TahotSubtypeOrdinalNumber, TahotSubtypeDemonstrative,
		TahotSubtypeInterrogative, TahotSubtypePersonal, TahotSubtypeRelative,
		TahotSubtypeDirectionalHe, TahotSubtypeParagogicHe, TahotSubtypeParagogicNun,
		TahotSubtypePronominal, TahotSubtypeAffirmation, TahotSubtypeConditional,
		TahotSubtypeDefiniteArticle, TahotSubtypeAramaicArticle,
		TahotSubtypeInterjection, TahotSubtypeNegative, TahotSubtypeObjectMarker,
		TahotSubtypeConsequenceAffirmation, TahotSubtypeWithArticle:
		return true
	}
	return false
}

func ParseTahotSubtype(s string) (TahotSubtype, error) {
	st := TahotSubtype(s)
	if !st.Valid() {
		return "", fmt.Errorf("invalid subtype %q", s)
	}
	return st, nil
}

// TahotVerbType is the conjugation/form of a verb. Its "N/A" sentinel is never
// stored (mapped to NULL at load), so it is absent on non-verb segments.
type TahotVerbType string

const (
	TahotVerbTypePerfect              TahotVerbType = "perfect"
	TahotVerbTypeSequentialPerfect    TahotVerbType = "consecutive perfect"
	TahotVerbTypeImperfect            TahotVerbType = "imperfect"
	TahotVerbTypeSequentialImperfect  TahotVerbType = "consecutive imperfect"
	TahotVerbTypeConjunctiveImperfect TahotVerbType = "conjunctive imperfect"
	TahotVerbTypeJussive              TahotVerbType = "jussive"
	TahotVerbTypeCohortative          TahotVerbType = "cohortative"
	TahotVerbTypeImperative           TahotVerbType = "imperative"
	TahotVerbTypeInfinitiveAbsolute   TahotVerbType = "infinitive absolute"
	TahotVerbTypeInfinitiveConstruct  TahotVerbType = "infinitive construct"
	TahotVerbTypeActiveParticiple     TahotVerbType = "active participle"
	TahotVerbTypePassiveParticiple    TahotVerbType = "passive participle"
)

func (v TahotVerbType) Valid() bool {
	switch v {
	case TahotVerbTypePerfect, TahotVerbTypeSequentialPerfect,
		TahotVerbTypeImperfect, TahotVerbTypeSequentialImperfect,
		TahotVerbTypeConjunctiveImperfect, TahotVerbTypeJussive,
		TahotVerbTypeCohortative, TahotVerbTypeImperative,
		TahotVerbTypeInfinitiveAbsolute, TahotVerbTypeInfinitiveConstruct,
		TahotVerbTypeActiveParticiple, TahotVerbTypePassiveParticiple:
		return true
	}
	return false
}

func ParseTahotVerbType(s string) (TahotVerbType, error) {
	v := TahotVerbType(s)
	if !v.Valid() {
		return "", fmt.Errorf("invalid verb type %q", s)
	}
	return v, nil
}

// TahotVerbStem is the decoded verb-stem label. The underlying codes are
// language-dependent (the same letter is a different stem in Hebrew vs Aramaic),
// but the decoded labels are flat; a few (pual, hithpael, hophal) occur in both
// languages. This is the closed union of values from the _VERB_STEMS table in
// morphology.py.
type TahotVerbStem string

const (
	// Hebrew
	TahotVerbStemQal        TahotVerbStem = "qal"
	TahotVerbStemNiphal     TahotVerbStem = "niphal"
	TahotVerbStemQalPassive TahotVerbStem = "qal passive"
	TahotVerbStemPiel       TahotVerbStem = "piel"
	TahotVerbStemPual       TahotVerbStem = "pual"
	TahotVerbStemPolal      TahotVerbStem = "polal"
	TahotVerbStemNithpael   TahotVerbStem = "nithpael"
	TahotVerbStemHothpaal   TahotVerbStem = "hothpaal"
	TahotVerbStemHithpael   TahotVerbStem = "hithpael"
	TahotVerbStemHiphil     TahotVerbStem = "hiphil"
	TahotVerbStemTiphil     TahotVerbStem = "tiphil"
	TahotVerbStemHophal     TahotVerbStem = "hophal"
	TahotVerbStemHishtaphel TahotVerbStem = "hishtaphel"
	// Aramaic
	TahotVerbStemPeal      TahotVerbStem = "peal"
	TahotVerbStemPeil      TahotVerbStem = "peil"
	TahotVerbStemPael      TahotVerbStem = "pael"
	TahotVerbStemHithpaal  TahotVerbStem = "hithpaal"
	TahotVerbStemItpeel    TahotVerbStem = "itpeel"
	TahotVerbStemHaphel    TahotVerbStem = "haphel"
	TahotVerbStemAphel     TahotVerbStem = "aphel"
	TahotVerbStemShaphel   TahotVerbStem = "shaphel"
	TahotVerbStemIshtaphel TahotVerbStem = "ishtaphel"
)

func (s TahotVerbStem) Valid() bool {
	switch s {
	case TahotVerbStemQal, TahotVerbStemNiphal, TahotVerbStemQalPassive,
		TahotVerbStemPiel, TahotVerbStemPual, TahotVerbStemPolal,
		TahotVerbStemNithpael, TahotVerbStemHothpaal, TahotVerbStemHithpael,
		TahotVerbStemHiphil, TahotVerbStemTiphil, TahotVerbStemHophal,
		TahotVerbStemHishtaphel, TahotVerbStemPeal, TahotVerbStemPeil,
		TahotVerbStemPael, TahotVerbStemHithpaal, TahotVerbStemItpeel,
		TahotVerbStemHaphel, TahotVerbStemAphel, TahotVerbStemShaphel,
		TahotVerbStemIshtaphel:
		return true
	}
	return false
}

func ParseTahotVerbStem(s string) (TahotVerbStem, error) {
	v := TahotVerbStem(s)
	if !v.Valid() {
		return "", fmt.Errorf("invalid verb stem %q", s)
	}
	return v, nil
}

type TahotPerson string

const (
	TahotPersonFirst  TahotPerson = "first"
	TahotPersonSecond TahotPerson = "second"
	TahotPersonThird  TahotPerson = "third"
)

func (p TahotPerson) Valid() bool {
	switch p {
	case TahotPersonFirst, TahotPersonSecond, TahotPersonThird:
		return true
	}
	return false
}

func ParseTahotPerson(s string) (TahotPerson, error) {
	p := TahotPerson(s)
	if !p.Valid() {
		return "", fmt.Errorf("invalid person %q", s)
	}
	return p, nil
}

// TahotGender includes common and both, which have no MorphGNT Greek analogue.
type TahotGender string

const (
	TahotGenderMasculine TahotGender = "masculine"
	TahotGenderFeminine  TahotGender = "feminine"
	TahotGenderCommon    TahotGender = "common"
	TahotGenderBoth      TahotGender = "both"
)

func (g TahotGender) Valid() bool {
	switch g {
	case TahotGenderMasculine, TahotGenderFeminine,
		TahotGenderCommon, TahotGenderBoth:
		return true
	}
	return false
}

func ParseTahotGender(s string) (TahotGender, error) {
	g := TahotGender(s)
	if !g.Valid() {
		return "", fmt.Errorf("invalid gender %q", s)
	}
	return g, nil
}

// TahotNumber includes dual, which has no MorphGNT Greek analogue.
type TahotNumber string

const (
	TahotNumberSingular TahotNumber = "singular"
	TahotNumberPlural   TahotNumber = "plural"
	TahotNumberDual     TahotNumber = "dual"
)

func (n TahotNumber) Valid() bool {
	switch n {
	case TahotNumberSingular, TahotNumberPlural, TahotNumberDual:
		return true
	}
	return false
}

func ParseTahotNumber(s string) (TahotNumber, error) {
	n := TahotNumber(s)
	if !n.Valid() {
		return "", fmt.Errorf("invalid number %q", s)
	}
	return n, nil
}

// TahotState is the noun/adjective state (determined is the Aramaic analogue of
// the Hebrew definite article).
type TahotState string

const (
	TahotStateAbsolute   TahotState = "absolute"
	TahotStateConstruct  TahotState = "construct"
	TahotStateDetermined TahotState = "determined"
)

func (s TahotState) Valid() bool {
	switch s {
	case TahotStateAbsolute, TahotStateConstruct, TahotStateDetermined:
		return true
	}
	return false
}

func ParseTahotState(s string) (TahotState, error) {
	st := TahotState(s)
	if !st.Valid() {
		return "", fmt.Errorf("invalid state %q", s)
	}
	return st, nil
}

// TahotFunctionMarker is the STEP trailing -o/-i/-r marker. Absent in the
// current TAHOT data, but decoded defensively.
type TahotFunctionMarker string

const (
	TahotFunctionMarkerObject         TahotFunctionMarker = "object"
	TahotFunctionMarkerIndirectObject TahotFunctionMarker = "indirect object"
	TahotFunctionMarkerRelated        TahotFunctionMarker = "related"
)

func (f TahotFunctionMarker) Valid() bool {
	switch f {
	case TahotFunctionMarkerObject, TahotFunctionMarkerIndirectObject,
		TahotFunctionMarkerRelated:
		return true
	}
	return false
}

func ParseTahotFunctionMarker(s string) (TahotFunctionMarker, error) {
	f := TahotFunctionMarker(s)
	if !f.Valid() {
		return "", fmt.Errorf("invalid function marker %q", s)
	}
	return f, nil
}

// TahotWordSegment is one morpheme (prefix / root / suffix) or punctuation mark of
// a Hebrew word, with its disambiguated Strong's number and decoded morphology.
// Morphology fields are NULL for punctuation segments, so they are pointers.
// MorphCode stays a plain string: it is the raw ETCBC/STEP grammar code (e.g.
// "Ncfsa"), kept verbatim rather than decoded into a closed set.
type TahotWordSegment struct {
	SegmentIndex    int                  `json:"segment_index"             db:"segment_index"`
	Kind            TahotSegmentKind     `json:"kind"                      db:"kind"`
	Hebrew          string               `json:"hebrew"                    db:"hebrew"`
	Transliteration *string              `json:"transliteration,omitempty" db:"transliteration"`
	Gloss           *string              `json:"gloss,omitempty"           db:"gloss"`
	Strong          *string              `json:"strong,omitempty"          db:"strong"`
	MorphCode       *string              `json:"morph_code,omitempty"      db:"morph_code"`
	Language        *TahotLanguage       `json:"language,omitempty"        db:"language"`
	PartOfSpeech    *TahotPartOfSpeech   `json:"part_of_speech,omitempty"  db:"part_of_speech"`
	Subtype         *TahotSubtype        `json:"subtype,omitempty"         db:"subtype"`
	VerbStem        *TahotVerbStem       `json:"verb_stem,omitempty"       db:"verb_stem"`
	VerbType        *TahotVerbType       `json:"verb_type,omitempty"       db:"verb_type"`
	Person          *TahotPerson         `json:"person,omitempty"          db:"person"`
	Gender          *TahotGender         `json:"gender,omitempty"          db:"gender"`
	Number          *TahotNumber         `json:"number,omitempty"          db:"number"`
	State           *TahotState          `json:"state,omitempty"           db:"state"`
	FunctionMarker  *TahotFunctionMarker `json:"function_marker,omitempty" db:"function_marker"`
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
