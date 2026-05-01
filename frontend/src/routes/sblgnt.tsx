import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import Header from "@/components/Header";
import { PassagePicker } from "@/components/PassagePicker/PassagePicker";

export const Route = createFileRoute("/sblgnt")({
  component: SblgntLayout,
});

function SblgntLayout() {
  const { passageRef } = useParams({ strict: false });
  // md:contents collapses these wrappers on wide viewports so the original
  // page-scroll layout is preserved (sticky sidebar etc). Below md, the
  // wrappers bound the layout to the viewport so MorphgntPassage's
  // ResizablePanelGroup has a known height to split.
  return (
    <div className="md:contents flex flex-col h-dvh">
      <Header>{passageRef ? <PassagePicker passageRef={passageRef} /> : null}</Header>
      <div className="md:contents flex-1 min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
