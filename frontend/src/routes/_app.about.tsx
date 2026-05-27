import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/about")({
  component: About,
});

function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="font-display text-2xl font-semibold">About Darash</h1>
      <p className="text-muted-foreground">Darash is under development! Come back soon.</p>
      <p>
        Darash is a Biblical Greek study app. More about the project, its goals, and how to use it
        will go here.
      </p>
    </div>
  );
}
