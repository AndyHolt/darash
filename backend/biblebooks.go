package main

import (
	"fmt"
)

type Testament int

const (
	OldTestament Testament = iota + 1
	NewTestament
)

type BookID int

const (
	Genesis BookID = iota + 1
	Exodus
	Leviticus
	Numbers
	Deuteronomy
	Joshua
	Judges
	Ruth
	FirstSamuel
	SecondSamuel
	FirstKings
	SecondKings
	FirstChronicles
	SecondChronicles
	Ezra
	Nehemiah
	Esther
	Job
	Psalms
	Proverbs
	Ecclesiastes
	SongOfSolomon
	Isaiah
	Jeremiah
	Lamentations
	Ezekiel
	Daniel
	Hosea
	Joel
	Amos
	Obadiah
	Jonah
	Micah
	Nahum
	Habakkuk
	Zephaniah
	Haggai
	Zechariah
	Malachi
	Matthew
	Mark
	Luke
	John
	Acts
	Romans
	FirstCorinthians
	SecondCorinthians
	Galatians
	Ephesians
	Philippians
	Colossians
	FirstThessalonians
	SecondThessalonians
	FirstTimothy
	SecondTimothy
	Titus
	Philemon
	Hebrews
	James
	FirstPeter
	SecondPeter
	FirstJohn
	SecondJohn
	ThirdJohn
	Jude
	Revelation
)

type Book struct {
	ID        BookID
	Name      string
	Abbrev    string
	Testament Testament
	Verses    []int // Verses[i] = verse count for chapter i+1
}

func (b Book) Chapters() int {
	return len(b.Verses)
}

func (b Book) VersesInChapter(chapter int) (int, error) {
	chapterIdx := chapter - 1
	if chapterIdx > b.Chapters() {
		return 0, fmt.Errorf("Book %s has no chapter %d", b.Name, chapter)
	}
	return b.Verses[chapterIdx], nil
}

// Verse numbers per chapter from: https://www.life-everlasting.net/pages/bible/Number%20of%20verses%20per%20chapter%20in%20Bible%20(KJV).php
var books = map[BookID]Book{
	Genesis: {
		ID: Genesis, Name: "Genesis", Abbrev: "Genesis", Testament: OldTestament,
		Verses: []int{31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 54, 33, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26},
	},
	Exodus: {
		ID: Exodus, Name: "Exodus", Abbrev: "Exodus", Testament: OldTestament,
		Verses: []int{22, 25, 22, 31, 23, 30, 29, 28, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 37, 30, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38},
	},
	Leviticus: {
		ID: Leviticus, Name: "Leviticus", Abbrev: "Leviticus", Testament: OldTestament,
		Verses: []int{17, 16, 17, 35, 26, 23, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34},
	},
	Numbers: {
		ID: Numbers, Name: "Numbers", Abbrev: "Numbers", Testament: OldTestament,
		Verses: []int{54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 35, 28, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 39, 17, 54, 42, 56, 29, 34, 13},
	},
	Deuteronomy: {
		ID: Deuteronomy, Name: "Deuteronomy", Abbrev: "Deuteronomy", Testament: OldTestament,
		Verses: []int{46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 31, 19, 29, 23, 22, 20, 22, 21, 20, 23, 29, 26, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12},
	},
	Joshua: {
		ID: Joshua, Name: "Joshua", Abbrev: "Joshua", Testament: OldTestament,
		Verses: []int{18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33},
	},
	Judges: {
		ID: Judges, Name: "Judges", Abbrev: "Judges", Testament: OldTestament,
		Verses: []int{36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25},
	},
	Ruth: {
		ID: Ruth, Name: "Ruth", Abbrev: "Ruth", Testament: OldTestament,
		Verses: []int{22, 23, 18, 22},
	},
	FirstSamuel: {
		ID: FirstSamuel, Name: "FirstSamuel", Abbrev: "FirstSamuel", Testament: OldTestament,
		Verses: []int{28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 16, 23, 28, 23, 43, 25, 12, 25, 11, 31, 13},
	},
	SecondSamuel: {
		ID: SecondSamuel, Name: "SecondSamuel", Abbrev: "SecondSamuel", Testament: OldTestament,
		Verses: []int{27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 32, 44, 26, 22, 51, 39, 25},
	},
	FirstKings: {
		ID: FirstKings, Name: "FirstKings", Abbrev: "FirstKings", Testament: OldTestament,
		Verses: []int{53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53},
	},
	SecondKings: {
		ID: SecondKings, Name: "SecondKings", Abbrev: "SecondKings", Testament: OldTestament,
		Verses: []int{18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 20, 22, 25, 29, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30},
	},
	FirstChronicles: {
		ID: FirstChronicles, Name: "FirstChronicles", Abbrev: "FirstChronicles", Testament: OldTestament,
		Verses: []int{54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30},
	},
	SecondChronicles: {
		ID: SecondChronicles, Name: "SecondChronicles", Abbrev: "SecondChronicles", Testament: OldTestament,
		Verses: []int{17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23},
	},
	Ezra: {
		ID: Ezra, Name: "Ezra", Abbrev: "Ezra", Testament: OldTestament,
		Verses: []int{11, 70, 13, 24, 17, 22, 28, 36, 15, 44},
	},
	Nehemiah: {
		ID: Nehemiah, Name: "Nehemiah", Abbrev: "Nehemiah", Testament: OldTestament,
		Verses: []int{11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31},
	},
	Esther: {
		ID: Esther, Name: "Esther", Abbrev: "Esther", Testament: OldTestament,
		Verses: []int{22, 23, 15, 17, 14, 14, 10, 17, 32, 3},
	},
	Job: {
		ID: Job, Name: "Job", Abbrev: "Job", Testament: OldTestament,
		Verses: []int{22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17},
	},
	Psalms: {
		ID: Psalms, Name: "Psalms", Abbrev: "Psalms", Testament: OldTestament,
		Verses: []int{
			6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6,
		},
	},
	Proverbs: {
		ID: Proverbs, Name: "Proverbs", Abbrev: "Proverbs", Testament: OldTestament,
		Verses: []int{33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31},
	},
	Ecclesiastes: {
		ID: Ecclesiastes, Name: "Ecclesiastes", Abbrev: "Ecclesiastes", Testament: OldTestament,
		Verses: []int{18, 26, 22, 17, 19, 12, 29, 17, 18, 20, 10, 14},
	},
	SongOfSolomon: {
		ID: SongOfSolomon, Name: "SongOfSolomon", Abbrev: "SongOfSolomon", Testament: OldTestament,
		Verses: []int{17, 17, 11, 16, 16, 12, 14, 14},
	},
	Isaiah: {
		ID: Isaiah, Name: "Isaiah", Abbrev: "Isaiah", Testament: OldTestament,
		Verses: []int{31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24},
	},
	Jeremiah: {
		ID: Jeremiah, Name: "Jeremiah", Abbrev: "Jeremiah", Testament: OldTestament,
		Verses: []int{19, 37, 25, 31, 31, 30, 34, 23, 25, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34},
	},
	Lamentations: {
		ID: Lamentations, Name: "Lamentations", Abbrev: "Lamentations", Testament: OldTestament,
		Verses: []int{22, 22, 66, 22, 22},
	},
	Ezekiel: {
		ID: Ezekiel, Name: "Ezekiel", Abbrev: "Ezekiel", Testament: OldTestament,
		Verses: []int{28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 44, 37, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35},
	},
	Daniel: {
		ID: Daniel, Name: "Daniel", Abbrev: "Daniel", Testament: OldTestament,
		Verses: []int{21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13},
	},
	Hosea: {
		ID: Hosea, Name: "Hosea", Abbrev: "Hosea", Testament: OldTestament,
		Verses: []int{9, 25, 5, 19, 15, 11, 16, 14, 17, 15, 11, 15, 15, 10},
	},
	Joel: {
		ID: Joel, Name: "Joel", Abbrev: "Joel", Testament: OldTestament,
		Verses: []int{20, 32, 21},
	},
	Amos: {
		ID: Amos, Name: "Amos", Abbrev: "Amos", Testament: OldTestament,
		Verses: []int{15, 16, 15, 13, 27, 14, 17, 14, 15},
	},
	Obadiah: {
		ID: Obadiah, Name: "Obadiah", Abbrev: "Obadiah", Testament: OldTestament,
		Verses: []int{21},
	},
	Jonah: {
		ID: Jonah, Name: "Jonah", Abbrev: "Jonah", Testament: OldTestament,
		Verses: []int{16, 11, 10, 11},
	},
	Micah: {
		ID: Micah, Name: "Micah", Abbrev: "Micah", Testament: OldTestament,
		Verses: []int{16, 13, 12, 14, 14, 16, 20},
	},
	Nahum: {
		ID: Nahum, Name: "Nahum", Abbrev: "Nahum", Testament: OldTestament,
		Verses: []int{14, 14, 19},
	},
	Habakkuk: {
		ID: Habakkuk, Name: "Habakkuk", Abbrev: "Habakkuk", Testament: OldTestament,
		Verses: []int{17, 20, 19},
	},
	Zephaniah: {
		ID: Zephaniah, Name: "Zephaniah", Abbrev: "Zephaniah", Testament: OldTestament,
		Verses: []int{18, 15, 20},
	},
	Haggai: {
		ID: Haggai, Name: "Haggai", Abbrev: "Haggai", Testament: OldTestament,
		Verses: []int{15, 23},
	},
	Zechariah: {
		ID: Zechariah, Name: "Zechariah", Abbrev: "Zechariah", Testament: OldTestament,
		Verses: []int{17, 17, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21},
	},
	Malachi: {
		ID: Malachi, Name: "Malachi", Abbrev: "Malachi", Testament: OldTestament,
		Verses: []int{14, 17, 24},
	},
	Matthew: {
		ID: Matthew, Name: "Matthew", Abbrev: "Matthew", Testament: NewTestament,
		Verses: []int{25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20},
	},
	Mark: {
		ID: Mark, Name: "Mark", Abbrev: "Mark", Testament: NewTestament,
		Verses: []int{45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20},
	},
	Luke: {
		ID: Luke, Name: "Luke", Abbrev: "Luke", Testament: NewTestament,
		Verses: []int{80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53},
	},
	John: {
		ID: John, Name: "John", Abbrev: "John", Testament: NewTestament,
		Verses: []int{51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25},
	},
	Acts: {
		ID: Acts, Name: "Acts", Abbrev: "Acts", Testament: NewTestament,
		Verses: []int{26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31},
	},
	Romans: {
		ID: Romans, Name: "Romans", Abbrev: "Romans", Testament: NewTestament,
		Verses: []int{32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27},
	},
	FirstCorinthians: {
		ID: FirstCorinthians, Name: "FirstCorinthians", Abbrev: "FirstCorinthians", Testament: NewTestament,
		Verses: []int{31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24},
	},
	SecondCorinthians: {
		ID: SecondCorinthians, Name: "SecondCorinthians", Abbrev: "SecondCorinthians", Testament: NewTestament,
		Verses: []int{24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14},
	},
	Galatians: {
		ID: Galatians, Name: "Galatians", Abbrev: "Galatians", Testament: NewTestament,
		Verses: []int{24, 21, 29, 31, 26, 18},
	},
	Ephesians: {
		ID: Ephesians, Name: "Ephesians", Abbrev: "Ephesians", Testament: NewTestament,
		Verses: []int{23, 22, 21, 32, 33, 24},
	},
	Philippians: {
		ID: Philippians, Name: "Philippians", Abbrev: "Philippians", Testament: NewTestament,
		Verses: []int{30, 30, 21, 23},
	},
	Colossians: {
		ID: Colossians, Name: "Colossians", Abbrev: "Colossians", Testament: NewTestament,
		Verses: []int{29, 23, 25, 18},
	},
	FirstThessalonians: {
		ID: FirstThessalonians, Name: "FirstThessalonians", Abbrev: "FirstThessalonians", Testament: NewTestament,
		Verses: []int{10, 20, 13, 18, 28},
	},
	SecondThessalonians: {
		ID: SecondThessalonians, Name: "SecondThessalonians", Abbrev: "SecondThessalonians", Testament: NewTestament,
		Verses: []int{12, 17, 18},
	},
	FirstTimothy: {
		ID: FirstTimothy, Name: "FirstTimothy", Abbrev: "FirstTimothy", Testament: NewTestament,
		Verses: []int{20, 15, 16, 16, 25, 21},
	},
	SecondTimothy: {
		ID: SecondTimothy, Name: "SecondTimothy", Abbrev: "SecondTimothy", Testament: NewTestament,
		Verses: []int{18, 26, 17, 22},
	},
	Titus: {
		ID: Titus, Name: "Titus", Abbrev: "Titus", Testament: NewTestament,
		Verses: []int{16, 15, 15},
	},
	Philemon: {
		ID: Philemon, Name: "Philemon", Abbrev: "Philemon", Testament: NewTestament,
		Verses: []int{25},
	},
	Hebrews: {
		ID: Hebrews, Name: "Hebrews", Abbrev: "Hebrews", Testament: NewTestament,
		Verses: []int{14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25},
	},
	James: {
		ID: James, Name: "James", Abbrev: "James", Testament: NewTestament,
		Verses: []int{27, 26, 18, 17, 20},
	},
	FirstPeter: {
		ID: FirstPeter, Name: "FirstPeter", Abbrev: "FirstPeter", Testament: NewTestament,
		Verses: []int{25, 25, 22, 19, 14},
	},
	SecondPeter: {
		ID: SecondPeter, Name: "SecondPeter", Abbrev: "SecondPeter", Testament: NewTestament,
		Verses: []int{21, 22, 18},
	},
	FirstJohn: {
		ID: FirstJohn, Name: "FirstJohn", Abbrev: "FirstJohn", Testament: NewTestament,
		Verses: []int{10, 29, 24, 21, 21},
	},
	SecondJohn: {
		ID: SecondJohn, Name: "SecondJohn", Abbrev: "SecondJohn", Testament: NewTestament,
		Verses: []int{13},
	},
	ThirdJohn: {
		ID: ThirdJohn, Name: "ThirdJohn", Abbrev: "ThirdJohn", Testament: NewTestament,
		Verses: []int{14},
	},
	Jude: {
		ID: Jude, Name: "Jude", Abbrev: "Jude", Testament: NewTestament,
		Verses: []int{25},
	},
	Revelation: {
		ID: Revelation, Name: "Revelation", Abbrev: "Revelation", Testament: NewTestament,
		Verses: []int{20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21},
	},
}

func Lookup(id BookID) (Book, bool) {
	b, ok := books[id]
	return b, ok
}

func All() []Book {
	out := make([]Book, 0, len(books))
	for id := Genesis; id <= Revelation; id++ {
		out = append(out, books[id])
	}
	return out
}
