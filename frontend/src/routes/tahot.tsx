import { createFileRoute } from "@tanstack/react-router";
import { ReaderLayout } from "@/components/ReaderLayout";

export const Route = createFileRoute("/tahot")({
  component: ReaderLayout,
});
