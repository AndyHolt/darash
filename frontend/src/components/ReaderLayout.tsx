import { type QueryKey, type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { Outlet, useParams } from "@tanstack/react-router";
import type { Reference } from "@/bible/references";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { PassagePicker } from "@/components/PassagePicker";
import { WordHelpSettings } from "@/components/WordHelpSettings";

// Shared chrome for the per-text reader routes (/sblgnt, /tahot): header with
// the passage picker, the routed passage view, and the footer.
export function ReaderLayout<TPassage extends { reference: Reference }, TKey extends QueryKey>({
  passageQuery,
}: {
  // The concrete passage query for this route's text, injected by the route so
  // the layout (and picker) stay text-agnostic. See routes/{sblgnt,tahot}.tsx.
  passageQuery: (ref: string) => UseQueryOptions<TPassage, Error, TPassage, TKey>;
}) {
  const { passageRef } = useParams({ strict: false });
  // Non-suspense read of the same query the routed passage view loads (shared
  // queryKey, so no extra fetch); feeds only the picker's trigger label.
  const {
    data: passage,
    isLoading,
    failureCount,
  } = useQuery({
    ...passageQuery(passageRef ?? ""),
    enabled: !!passageRef,
  });
  // Below md, the layout is bound to the viewport so the passage component's
  // ResizablePanelGroup has a known height to split; the footer is rendered
  // inside the text panel by the passage component itself.
  // From md up, the wrapper uses min-h-dvh + flex-col so the page scrolls
  // normally (preserving the sticky header/sidebar) and the footer sits at
  // the bottom — only visible when scrolled fully down, or at the bottom of
  // the viewport when content is short.
  return (
    <div className="flex flex-col h-dvh md:h-auto md:min-h-dvh">
      <Header rightActions={<WordHelpSettings />}>
        <PassagePicker passageRef={passageRef} query={{ passage, isLoading, failureCount }} />
      </Header>
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
      <Footer className="hidden md:block" />
    </div>
  );
}
