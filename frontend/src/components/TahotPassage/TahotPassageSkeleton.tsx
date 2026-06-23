import { Item, ItemContent } from "@/components/ui/item";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";

// Each entry is a paragraph; widths chosen so successive lines look like prose
// rather than a uniform stack, with a shorter trailing line. The default Hebrew
// passage (Genesis 1) is prose, so the skeleton models prose paragraphs.
const PARAGRAPH_LINES = [
  "w-full",
  "w-[92%]",
  "w-[85%]",
  "w-full",
  "w-[90%]",
  "w-[70%]",
  "w-full",
  "w-[88%]",
  "w-[55%]",
];
const PARAGRAPH_LINE_WIDTHS: string[][] = [PARAGRAPH_LINES, PARAGRAPH_LINES];

const CARD_COUNT = 6;

export function TahotPassageSkeleton() {
  const isWide = useMediaQuery("(min-width: 768px)");

  // dir="rtl" so the shorter trailing line aligns to the right, matching how
  // RTL Hebrew prose actually wraps.
  const textBlock = (
    <div className="font-hebrew leading-9 py-1" dir="rtl">
      {PARAGRAPH_LINE_WIDTHS.map((widths, pIdx) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static decorative skeleton paragraphs.
        <div key={pIdx} className="space-y-2 mb-8 last:mb-0">
          {widths.map((w, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative skeleton lines.
            <Skeleton key={i} className={`h-5 ${w}`} />
          ))}
        </div>
      ))}
    </div>
  );

  // Light mode: `--muted` is nearly identical to `--sidebar`, so the default
  // skeleton color disappears against the sidebar background — override with
  // `bg-sidebar-accent`. Dark mode: `--muted` already contrasts well against
  // the much darker sidebar, so keep it via `dark:bg-muted`.
  const skeletonBg = "bg-sidebar-accent dark:bg-muted";
  const cardBlock = (
    <div className="flex flex-col gap-2">
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static decorative skeleton cards.
        <Item key={i} variant="default" size="xs">
          {/* Override the size=xs gap-0 default on ItemContent — real cards
              get visual breathing room from text line-height, which fixed-
              height skeleton bars lack. */}
          <ItemContent className="group-data-[size=xs]/item:gap-1.5">
            <Skeleton className={`h-4 w-24 ${skeletonBg}`} />
            <Skeleton className={`h-3 w-40 ${skeletonBg}`} />
            <Skeleton className={`h-3 w-32 ${skeletonBg}`} />
          </ItemContent>
        </Item>
      ))}
    </div>
  );

  // Sidebar on the left to mirror the RTL reading layout (see PassageLayout).
  if (isWide) {
    return (
      <div className="my-2 mx-4 flex flex-row justify-center gap-x-16 items-start">
        <aside className="w-72 sticky top-2 max-h-dvh overflow-y-auto bg-sidebar text-sidebar-foreground my-2 py-2 px-4 border border-border rounded-md">
          {cardBlock}
        </aside>
        <div className="max-w-lg w-full">{textBlock}</div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup orientation="vertical" className="h-full">
      <ResizablePanel defaultSize={60} minSize={20}>
        <div className="h-full overflow-y-auto px-4 py-2">{textBlock}</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={40} minSize={15}>
        <div className="h-full overflow-y-auto bg-sidebar text-sidebar-foreground py-2 px-4">
          {cardBlock}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
