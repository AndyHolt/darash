import type React from "react";
import Footer from "@/components/Footer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface PassageLayoutProps {
  /** The rendered passage text (prose paragraphs, poetry blocks, …). */
  text: React.ReactNode;
  /** The word-help sidebar contents. */
  help: React.ReactNode;
  /** Source/licence attribution, shown beneath the text. */
  attribution: React.ReactNode;
  /** Class for the text container — typically the script font + line height. */
  textClassName?: string;
  /** Reading-column text direction. RTL scripts (Hebrew) pass `"rtl"`. */
  dir?: "ltr" | "rtl";
  /**
   * Which side the help sidebar sits on in the wide layout. RTL texts mirror
   * the LTR layout by placing it on the left. Ignored in the narrow layout,
   * where help is always stacked below the text.
   */
  sidebarSide?: "left" | "right";
}

/**
 * Text-agnostic responsive shell for a passage reading view. Wide (≥ md):
 * centred text column with a sticky help sidebar. Narrow: a vertical resizable
 * split (text on top, help below) with the footer pinned beneath the text.
 * Each text supplies its own rendered words/cards and font; the layout owns the
 * structure shared across texts.
 */
export function PassageLayout({
  text,
  help,
  attribution,
  textClassName,
  dir,
  sidebarSide = "right",
}: PassageLayoutProps) {
  // Matches Tailwind's md breakpoint. Wide → sidebar with page scroll.
  // Narrow → vertical resizable split (text on top, word help below).
  const isWide = useMediaQuery("(min-width: 768px)");

  const textColumn = (
    <div className={textClassName} dir={dir}>
      {text}
    </div>
  );

  if (isWide) {
    const column = (
      <div className="max-w-lg">
        {textColumn}
        {attribution}
      </div>
    );
    const aside = (
      <aside className="w-xs sticky top-16 max-h-[calc(100dvh-3rem)] overflow-y-auto bg-sidebar text-sidebar-foreground my-2 py-2 px-4 border border-border rounded-md">
        {help}
      </aside>
    );
    return (
      <div className="my-2 mx-4 flex flex-row justify-center gap-x-16 items-start">
        {sidebarSide === "left" ? (
          <>
            {aside}
            {column}
          </>
        ) : (
          <>
            {column}
            {aside}
          </>
        )}
      </div>
    );
  }

  return (
    <ResizablePanelGroup orientation="vertical" className="h-full">
      <ResizablePanel defaultSize={60} minSize={20}>
        <div className="h-full overflow-y-auto">
          {/* min-h-full + flex-col pins the footer to the bottom of the
              panel when the text is short, and reveals it after the text
              when the text overflows. */}
          <div className="min-h-full flex flex-col">
            <div className="px-4 py-2 flex-1">
              {textColumn}
              {attribution}
            </div>
            <Footer />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={40} minSize={15}>
        <div className="h-full overflow-y-auto bg-sidebar text-sidebar-foreground py-2 px-4">
          {help}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
