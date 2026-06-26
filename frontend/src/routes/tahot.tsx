import { createFileRoute } from "@tanstack/react-router";
import { ReaderLayout } from "@/components/ReaderLayout";
import { passageQuery } from "@/texts/tahot";

export const Route = createFileRoute("/tahot")({
  component: TahotLayout,
});

function TahotLayout() {
  return <ReaderLayout passageQuery={passageQuery} />;
}
