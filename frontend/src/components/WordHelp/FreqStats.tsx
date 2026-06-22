import type React from "react";
import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Hover/click popover for word-frequency stats. The open/close-on-hover
 * machinery and trigger/content styling are shared across texts; callers pass
 * the compact trigger label and the popover body (typically a `FreqRow` table
 * plus an explanatory footnote).
 */
export function FreqStatsPopover({
  triggerLabel,
  children,
}: {
  triggerLabel: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // Stop the card's click handler from also pinning/unpinning the word.
          onClick={(e) => e.stopPropagation()}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") {
              cancelClose();
              setOpen(true);
            }
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") scheduleClose();
          }}
          className="rounded-sm font-mono text-xs tabular-nums text-sidebar-muted-foreground transition-colors outline-none hover:text-sidebar-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {triggerLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-auto max-w-xs gap-2 text-xs"
        onPointerEnter={cancelClose}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") scheduleClose();
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** A single form/lemma row in the frequency-stats table. */
export function FreqRow({
  label,
  kind,
  count,
  rank,
}: {
  label: React.ReactNode;
  kind: string;
  count: number;
  rank: number;
}) {
  return (
    <tr>
      <th scope="row" className="pr-3 text-left font-normal">
        {label} <span className="text-sidebar-muted-foreground">({kind})</span>
      </th>
      <td className="pr-3 tabular-nums">{count}×</td>
      <td className="tabular-nums text-sidebar-muted-foreground"># {rank}</td>
    </tr>
  );
}
