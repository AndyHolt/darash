/**
 * Parses the lightly-marked-up "meaning" strings from the STEPBible lexicons —
 * TBESG for Greek, TBESH for Hebrew — into a tree of {@link MeaningSpan}s: a
 * small, presentation-agnostic model that `MeaningText` turns into React
 * components. The source markup is HTML-ish but not valid HTML (e.g.
 * `<ref='Act.20.37'>`, `<re>`, `__1.` sense markers), so it is parsed leniently
 * with htmlparser2 rather than fed to the DOM. TBESH uses a strict subset of
 * TBESG's markup, so one parser serves both.
 */

import { Parser } from "htmlparser2";

/**
 * A meaning (single definition entry) is composed of three types of span: a
 * string of plain `text`, a line `break`, or a markup element (e.g. bold,
 * italic, etc) which wraps further spans. An element carries its `tag` and any
 * `attrs` verbatim.
 */
export type MeaningSpan =
  | { type: "text"; value: string }
  | { type: "break" }
  | { type: "element"; tag: string; attrs: Record<string, string>; children: MeaningSpan[] };

/** Lexicon tags that denote a line break and never wrap content. */
const VOID_TAGS = new Set(["br", "lb"]);

/**
 * Strips the `__` sense-division markers (`__1.`, `__(a)`) from a text run; they
 * are redundant once each sense sits on its own line. Entity decoding is left to
 * the parser.
 */
function stripSenseMarkers(text: string): string {
  return text.replace(/__/g, "");
}

/**
 * Lexicon `<ref='Mat.1.1'>` tags omit both the space and the attribute name that
 * HTML/XML require, so a spec parser folds the `='…'` into the tag name and then
 * can't match the `</ref>` close. Rewriting it to `<ref target='Mat.1.1'>` makes
 * it well-formed: the tag closes cleanly and the reference survives under a
 * named attribute.
 */
function normalizeTags(markup: string): string {
  return markup.replace(/<([a-zA-Z]+)=/g, "<$1 target=");
}

/**
 * Parses lexicon meaning markup into a {@link MeaningSpan} tree. htmlparser2 runs
 * in lenient HTML mode, so unclosed tags auto-close at the end of input and
 * stray closing tags are ignored — malformed source can never throw or
 * unbalance the tree. Adjacent text runs (which the parser may emit in pieces,
 * e.g. either side of a decoded entity) are coalesced into one text span.
 */
export function parseMeaning(markup: string): MeaningSpan[] {
  const root: MeaningSpan[] = [];
  const childStack: MeaningSpan[][] = [root];
  const tagStack: string[] = [];
  const current = () => childStack[childStack.length - 1];

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        if (VOID_TAGS.has(name)) {
          current().push({ type: "break" });
          return;
        }
        const node: MeaningSpan = {
          type: "element",
          tag: name,
          attrs: { ...attribs },
          children: [],
        };
        current().push(node);
        childStack.push(node.children);
        tagStack.push(name);
      },
      ontext(text) {
        const value = stripSenseMarkers(text);
        if (!value) return;
        const siblings = current();
        const last = siblings[siblings.length - 1];
        if (last?.type === "text") last.value += value;
        else siblings.push({ type: "text", value });
      },
      onclosetag(name) {
        if (VOID_TAGS.has(name)) return;
        // Pop to the nearest matching open tag; a closer with no open tag
        // (lastIndexOf === -1) is left alone.
        const depth = tagStack.lastIndexOf(name);
        if (depth === -1) return;
        tagStack.length = depth;
        childStack.length = depth + 1;
      },
    },
    { decodeEntities: true },
  );
  parser.write(normalizeTags(markup));
  parser.end();

  return root;
}
