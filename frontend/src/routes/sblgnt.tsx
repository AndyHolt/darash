import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import Header from "@/components/Header";

export const Route = createFileRoute("/sblgnt")({
  component: SblgntLayout,
});

function SblgntLayout() {
  const { passageRef } = useParams({ strict: false });
  return (
    <>
      <Header>
        {passageRef ? (
          <span className="text-sm text-muted-foreground font-mono">{passageRef}</span>
        ) : null}
      </Header>
      <Outlet />
    </>
  );
}
