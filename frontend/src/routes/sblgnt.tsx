import { createFileRoute } from "@tanstack/react-router";
import { ReaderLayout } from "@/components/ReaderLayout";
import { passageQuery } from "@/texts/morphgnt";

export const Route = createFileRoute("/sblgnt")({
  component: SblgntLayout,
});

function SblgntLayout() {
  return <ReaderLayout passageQuery={passageQuery} />;
}
