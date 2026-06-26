import { Outlet, useParams } from "@tanstack/react-router";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { PassagePicker } from "@/components/PassagePicker";
import { WordHelpSettings } from "@/components/WordHelpSettings";

// Shared chrome for the per-text reader routes (/sblgnt, /tahot): header with
// the passage picker, the routed passage view, and the footer.
export function ReaderLayout() {
  const { passageRef } = useParams({ strict: false });
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
        <PassagePicker passageRef={passageRef} />
      </Header>
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
      <Footer className="hidden md:block" />
    </div>
  );
}
