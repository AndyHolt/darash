import { createFileRoute } from "@tanstack/react-router";
import { redirectToDefaultPassage } from "@/texts/tahot";

export const Route = createFileRoute("/tahot/")({
  beforeLoad: redirectToDefaultPassage,
});
