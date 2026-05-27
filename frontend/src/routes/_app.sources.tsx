import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/sources")({
  component: Sources,
});

function Sources() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="font-display text-2xl font-semibold">Sources</h1>
      <p className="text-muted-foreground">
        Darash builds on freely-available scholarly data. Detailed attribution will go here.
      </p>
      <section className="space-y-2">
        <h2 className="font-semibold">Greek text</h2>
        <p>
          The Greek text and morphological tagging are from the{" "}
          <a
            href="https://morphgnt.org"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-primary"
          >
            MorphGNT
          </a>{" "}
          project's tagging of the SBL Greek New Testament (SBLGNT).
        </p>
      </section>
    </div>
  );
}
