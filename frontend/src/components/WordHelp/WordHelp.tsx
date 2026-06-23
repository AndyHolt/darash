import type React from "react";
import { useEffect, useRef } from "react";
import { Item, ItemContent } from "@/components/ui/item";
import { cn } from "@/lib/utils";

/**
 * The complete hover/focus/pin interaction for a single word — the *producer*
 * contract. `usePassageReader` always returns every field populated, so a word
 * span or help card that spreads it gets fully-wired interactivity. This is the
 * canonical shape; the card-facing type below is derived from it.
 */
export interface WordInteraction {
  focused: boolean;
  pinned: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

/**
 * The interaction props a word-help card *accepts* — the *consumer* contract.
 * Every field is optional because a card legitimately renders fully static (no
 * hover/pin), e.g. in tests or a non-interactive context. The base shell and
 * each dataset card (`MorphgntWordHelp`, `TahotWordHelp`) extend this so the
 * wiring is defined once.
 */
export type WordHelpInteraction = Partial<WordInteraction>;

export interface WordHelpProps extends WordHelpInteraction {
  children: React.ReactNode;
}

/**
 * Text-agnostic shell for a word-help card: the hover/focus styling, click
 * affordance, and the scroll-into-view-when-pinned behaviour shared by every
 * text's word help. Callers supply the title and data rows as `children`
 * (typically an `ItemTitle` followed by `WordDataRow`s).
 */
export function WordHelp({
  focused,
  pinned,
  onMouseEnter,
  onMouseLeave,
  onClick,
  children,
}: WordHelpProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pinned) {
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [pinned]);

  return (
    <Item
      ref={ref}
      variant="default"
      size="xs"
      data-focused={focused ? "true" : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="cursor-pointer transition-colors data-[focused=true]:bg-sidebar-accent data-[focused=true]:text-sidebar-primary"
    >
      <ItemContent>{children}</ItemContent>
    </Item>
  );
}

/** A muted, small data row inside a word-help card (parsing, gloss, etc.). */
export function WordDataRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-left text-sm leading-normal font-normal text-sidebar-muted-foreground group-data-[size=xs]/item:text-xs",
        className,
      )}
      {...props}
    />
  );
}
