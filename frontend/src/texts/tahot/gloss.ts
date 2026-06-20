// TAHOT segment glosses arrive in STEPBible's extended format. Most are already
// clean ("in", "to create", "the"), but expanded entries decorate the primary
// lexical gloss with extra context that we strip back off:
//
//   ": beginning»first:1_beginning"   leading ": " marker, then a "»" alternate
//   "God»LORD@Gen.1.1-Heb"            an "@" reference note
//
// Everything from the first "»" or "@" onwards is alternate/sense/reference
// detail; we keep only the primary lexical gloss, tidied for reading.

const EXTENDED_ENTRY_MARKER = /^\s*:\s*/; // leading ": " flagging an expanded entry
const ALTERNATE_OR_NOTE = /[»@].*/; // "»alternate" / "@ref" trailing the primary gloss
const WORD_JOINER = /_/g; // underscores stand in for spaces in multi-word glosses

export function cleanGloss(gloss: string | undefined): string {
  if (!gloss) return "";
  return gloss
    .replace(EXTENDED_ENTRY_MARKER, "")
    .replace(ALTERNATE_OR_NOTE, "")
    .replace(WORD_JOINER, " ")
    .trim();
}
