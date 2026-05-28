import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/about")({
  component: About,
});

function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="font-display text-2xl font-semibold text-primary">About Darash</h1>
      <p>Darash is an interactive reader for the Greek New Testament.</p>
      <p>
        Like hard-copy reader's editions, morphology (parsing) and meaning (gloss) helps are
        provided for less common words. Unliike hard-copy reader's editions, the amount of help
        shown is adjustable. For beginners, more helps can be shown. As you advance in ability and
        vocabulary acquisition, less help can be shown, reducing dependance on helps.
      </p>
      <p>
        For words which are within your current range, but eluding immediate understanding, clicking
        or tapping on the word brings up help, allowing continued progress without getting stuck.
      </p>
    </div>
  );
}
