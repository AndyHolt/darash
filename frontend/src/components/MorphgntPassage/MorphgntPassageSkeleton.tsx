import { Item, ItemContent } from "@/components/ui/item";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";

// Each entry is a paragraph; widths chosen so successive lines look like
// prose rather than a uniform stack, with a shorter trailing line.
const PARAGRAPH_LINES = [
  "w-full",
  "w-[95%]",
  "w-[88%]",
  "w-full",
  "w-[92%]",
  "w-[78%]",
  "w-full",
  "w-[85%]",
  "w-[60%]",
];
const PARAGRAPH_LINE_WIDTHS: string[][] = [PARAGRAPH_LINES, PARAGRAPH_LINES];

const CARD_COUNT = 6;

export function MorphgntPassageSkeleton() {
  const isWide = useMediaQuery("(min-width: 768px)");

  const textBlock = (
    <div className="font-greek leading-7 py-1">
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

  if (isWide) {
    return (
      <div className="my-2 mx-4 flex flex-row justify-center gap-x-16 items-start">
        <div className="max-w-lg w-full">{textBlock}</div>
        <aside className="w-72 sticky top-2 max-h-dvh overflow-y-auto bg-sidebar text-sidebar-foreground my-2 py-2 px-4 border border-border rounded-md">
          {cardBlock}
        </aside>
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
