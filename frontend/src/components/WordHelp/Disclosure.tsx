import { ChevronRight } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A collapsible row inside a word-help card: a chevron-suffixed summary button
 * that toggles `children`, with an optional `trailing` slot rendered beside the
 * summary (e.g. frequency stats). Text-agnostic; the summary and content are
 * supplied by the caller. Clicking the toggle does not bubble to the card, so it
 * never pins/unpins the word.
 */
export function Disclosure({
  summary,
  trailing,
  children,
}: {
  summary: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-expanded={expanded}
          // Stop the card's click handler from also pinning/unpinning the word.
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="group/disclosure inline-flex items-center gap-0.5 text-left text-inherit hover:text-sidebar-foreground transition-colors"
        >
          <span className="group-hover/disclosure:decoration-sidebar-foreground/60">{summary}</span>
          <ChevronRight
            className={cn("size-3 shrink-0 transition-transform", expanded && "rotate-90")}
          />
        </button>
        {trailing}
      </div>
      {expanded && children}
    </>
  );
}
