import { createFileRoute } from "@tanstack/react-router";
import { redirectToDefaultTahotPassage } from "@/texts/tahot";

export const Route = createFileRoute("/tahot/")({
  beforeLoad: redirectToDefaultTahotPassage,
});
