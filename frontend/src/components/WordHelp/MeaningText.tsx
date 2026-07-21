/**
 * Renders lexicon definitions — TBESG for Greek, TBESH for Hebrew — from the
 * parsed {@link MeaningSpan} tree: {@link MeaningText} for one definition, and
 * {@link DefinitionList} for the set a word-help card shows when expanded.
 */

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type MeaningSpan, parseMeaning } from "@/texts/lexicon";

// The parsed meaning tree is rendered by mapping each lexicon source tag to a
// small, named component describing what that piece of the definition *is*.
// These components emit only a semantic element or a class hook — the emphasis
// "stack" (colours, weight) is defined in one place in the `.definition` block
// in index.css. Tags with no entry here (a, greek, def, corr, …) fall through
// to their text content.

function Bold({ children }: { children: ReactNode }) {
  // Headword and key sense glosses; the anchor of each entry.
  return <strong>{children}</strong>;
}

function Italic({ children }: { children: ReactNode }) {
  return <em>{children}</em>;
}

function BibleRef({ children }: { children: ReactNode }) {
  // Styled plain text for now; a later change will make this a link to the
  // referenced passage.
  return <span className="meaning-ref">{children}</span>;
}

function RelatedWords({ children }: { children: ReactNode }) {
  // Lexicon <re>: a cross-reference / synonym note (e.g. "SYN.: …").
  return <span className="meaning-re">{children}</span>;
}

function Citation({ children }: { children: ReactNode }) {
  // <author>/<date>: the source attributed to a cited form.
  return <cite>{children}</cite>;
}

function Note({ children }: { children: ReactNode }) {
  return <span className="meaning-note">{children}</span>;
}

type SpanComponent = (props: { children: ReactNode }) => ReactNode;

const TAG_COMPONENTS: Record<string, SpanComponent> = {
  b: Bold,
  i: Italic,
  ref: BibleRef,
  re: RelatedWords,
  author: Citation,
  date: Citation,
  note: Note,
};

function renderSpan(span: MeaningSpan): ReactNode {
  switch (span.type) {
    case "text":
      return span.value;
    case "break":
      return <br />;
    case "element": {
      const children = renderSpans(span.children);
      const Component = TAG_COMPONENTS[span.tag];
      return Component ? <Component>{children}</Component> : children;
    }
    default: {
      const _exhaustive: never = span;
      return _exhaustive;
    }
  }
}

function renderSpans(spans: MeaningSpan[]): ReactNode {
  return spans.map((span, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: the parsed spans are static and never reordered within a render, so positional keys are stable and correct.
    <Fragment key={i}>{renderSpan(span)}</Fragment>
  ));
}

export function MeaningText({ markup }: { markup: string }) {
  return <>{renderSpans(parseMeaning(markup))}</>;
}

/** The definitions a word-help card reveals when its gloss is expanded. */
export function DefinitionList({ meanings }: { meanings: string[] }) {
  return (
    <div className="definition mt-1 text-xs leading-relaxed font-lexicon">
      {meanings.map((markup, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: lexicon entries for a word are a fixed list that is never reordered.
        <p key={i} className={cn(i > 0 && "mt-2")}>
          <MeaningText markup={markup} />
        </p>
      ))}
    </div>
  );
}
