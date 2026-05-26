import { createFileRoute } from "@tanstack/react-router";
import { redirectToDefaultPassage } from "@/texts/morphgnt";

export const Route = createFileRoute("/sblgnt/")({
  beforeLoad: redirectToDefaultPassage,
});
