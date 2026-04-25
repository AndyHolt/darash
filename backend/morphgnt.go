package main

import "fmt"

type WordCount struct {
	Count int64 `json:"count"`
}

type PartOfSpeech string

const (
	PartOfSpeechAdjective               PartOfSpeech = "adjective"
	PartOfSpeechConjunction             PartOfSpeech = "conjunction"
	PartOfSpeechAdverb                  PartOfSpeech = "adverb"
	PartOfSpeechInterjection            PartOfSpeech = "interjection"
	PartOfSpeechNoun                    PartOfSpeech = "noun"
	PartOfSpeechPreposition             PartOfSpeech = "preposition"
	PartOfSpeechArticle                 PartOfSpeech = "article"
	PartOfSpeechDemonstrativePronoun    PartOfSpeech = "demonstrative pronoun"
	PartOfSpeechInterrogativeIndefinite PartOfSpeech = "interrogative/indefinite pronoun"
	PartOfSpeechPersonalPronoun         PartOfSpeech = "personal pronoun"
	PartOfSpeechRelativePronoun         PartOfSpeech = "relative pronoun"
	PartOfSpeechVerb                    PartOfSpeech = "verb"
	PartOfSpeechParticle                PartOfSpeech = "particle"
)

func (p PartOfSpeech) Valid() bool {
	switch p {
	case PartOfSpeechAdjective, PartOfSpeechConjunction, PartOfSpeechAdverb,
		PartOfSpeechInterjection, PartOfSpeechNoun, PartOfSpeechPreposition,
		PartOfSpeechArticle, PartOfSpeechDemonstrativePronoun,
		PartOfSpeechInterrogativeIndefinite, PartOfSpeechPersonalPronoun,
		PartOfSpeechRelativePronoun, PartOfSpeechVerb, PartOfSpeechParticle:
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

type Tense string

const (
	TensePresent    Tense = "present"
	TenseImperfect  Tense = "imperfect"
	TenseFuture     Tense = "future"
	TenseAorist     Tense = "aorist"
	TensePerfect    Tense = "perfect"
	TensePluperfect Tense = "pluperfect"
)

func (t Tense) Valid() bool {
	switch t {
	case TensePresent, TenseImperfect, TenseFuture, TenseAorist, TensePerfect, TensePluperfect:
		return true
	}
	return false
}

func ParseTense(s string) (Tense, error) {
	t := Tense(s)
	if !t.Valid() {
		return "", fmt.Errorf("invalid tense %q", s)
	}
	return t, nil
}

type Voice string

const (
	VoiceActive  Voice = "active"
	VoiceMiddle  Voice = "middle"
	VoicePassive Voice = "passive"
)

func (v Voice) Valid() bool {
	switch v {
	case VoiceActive, VoiceMiddle, VoicePassive:
		return true
	}
	return false
}

func ParseVoice(s string) (Voice, error) {
	v := Voice(s)
	if !v.Valid() {
		return "", fmt.Errorf("invalid voice %q", s)
	}
	return v, nil
}

type Mood string

const (
	MoodIndicative  Mood = "indicative"
	MoodImperative  Mood = "imperative"
	MoodSubjunctive Mood = "subjunctive"
	MoodOptative    Mood = "optative"
	MoodInfinitive  Mood = "infinitive"
	MoodParticiple  Mood = "participle"
)

func (m Mood) Valid() bool {
	switch m {
	case MoodIndicative, MoodImperative, MoodSubjunctive,
		MoodOptative, MoodInfinitive, MoodParticiple:
		return true
	}
	return false
}

func ParseMood(s string) (Mood, error) {
	m := Mood(s)
	if !m.Valid() {
		return "", fmt.Errorf("invalid mood %q", s)
	}
	return m, nil
}

type Case string

const (
	CaseNominative Case = "nominative"
	CaseGenitive   Case = "genitive"
	CaseDative     Case = "dative"
	CaseAccusative Case = "accusative"
	CaseVocative   Case = "vocative"
)

func (c Case) Valid() bool {
	switch c {
	case CaseNominative, CaseGenitive, CaseDative, CaseAccusative, CaseVocative:
		return true
	}
	return false
}

func ParseCase(s string) (Case, error) {
	c := Case(s)
	if !c.Valid() {
		return "", fmt.Errorf("invalid case %q", s)
	}
	return c, nil
}

type Number string

const (
	NumberSingular Number = "singular"
	NumberPlural   Number = "plural"
)

func (n Number) Valid() bool {
	switch n {
	case NumberSingular, NumberPlural:
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

type Gender string

const (
	GenderMasculine Gender = "masculine"
	GenderFeminine  Gender = "feminine"
	GenderNeuter    Gender = "neuter"
)

func (g Gender) Valid() bool {
	switch g {
	case GenderMasculine, GenderFeminine, GenderNeuter:
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

type Degree string

const (
	DegreeComparative Degree = "comparative"
	DegreeSuperlative Degree = "superlative"
)

func (d Degree) Valid() bool {
	switch d {
	case DegreeComparative, DegreeSuperlative:
		return true
	}
	return false
}

func ParseDegree(s string) (Degree, error) {
	d := Degree(s)
	if !d.Valid() {
		return "", fmt.Errorf("invalid degree %q", s)
	}
	return d, nil
}

type Word struct {
	Book         string       `json:"book"`
	Chapter      int          `json:"chapter"`
	Verse        int          `json:"verse"`
	WordIndex    int          `json:"word_index"`
	PartOfSpeech PartOfSpeech `json:"part_of_speech"`
	Person       *Person      `json:"person,omitempty"`
	Tense        *Tense       `json:"tense,omitempty"`
	Voice        *Voice       `json:"voice,omitempty"`
	Mood         *Mood        `json:"mood,omitempty"`
	Case         *Case        `json:"case,omitempty"`
	Number       *Number      `json:"number,omitempty"`
	Gender       *Gender      `json:"gender,omitempty"`
	Degree       *Degree      `json:"degree,omitempty"`
	Text         string       `json:"text"`
	TextWord     string       `json:"text_word"`
	Normalized   string       `json:"normalized"`
	Lemma        string       `json:"lemma"`
}

type Passage struct {
	Reference Reference `json:"reference"`
	Words     []Word    `json:"words"`
}
