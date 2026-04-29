import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import Header from "@/components/Header";
import { PassagePicker } from "@/components/PassagePicker";

export const Route = createFileRoute("/sblgnt")({
  component: SblgntLayout,
});

function SblgntLayout() {
  const { passageRef } = useParams({ strict: false });
  return (
    <>
      <Header>{passageRef ? <PassagePicker passageRef={passageRef} /> : null}</Header>
      <Outlet />
    </>
  );
}
