import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/about")({
  component: About,
});

function About() {
  return <div className="p-2">Darash is under development! Come back soon.</div>;
}
