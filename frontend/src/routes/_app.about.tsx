import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/about")({
  component: About,
});

function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="font-display text-2xl font-semibold text-primary">About Darash</h1>
      <p>Darash is an interactive reader for the Bible in Hebrew and Greek.</p>
      <p>
        Like physical original language reader's editions, Darash displays the text with helps:
        morphology for difficult forms and meanings for unfamiliar words.
      </p>
      <p>
        Unlike physical reader's editions, the amount of help is configurable, and the text and
        helps are interactive.
      </p>
      <p>
        For beginners, more helps can be shown. As you advance in ability and vocabulary
        acquisition, less help can be shown, reducing dependence on helps.
      </p>
      <p>
        For words which are within your current range, but eluding immediate understanding, clicking
        or tapping on the word brings up help, allowing continued progress without getting stuck.
      </p>

      <p>
        While physical editions can show only a gloss for a word, in Darash, a full lexicon entry is
        just a tap away. I find this hugely valuable to understand a word's use in the current
        passage. And it helps to acquire vocabulary by understanding the range of meanings, not just
        a single gloss, which may be peripheral to the word's basic meaning or common use.
      </p>
      <h2 className="font-display text-lg font-semibold text-primary">
        Why the name? (What is a darash?)
      </h2>
      <blockquote className="text-center">
        <p>
          כִּי עֶזְרָא הֵכִין לְבָבוֹ <span className="font-semibold text-primary">לִדְרוֹשׁ</span> אֶת־תּוֹרַת יְהוָה
          וְלַעֲשֹׂת וּלְלַמֵּד בְּיִשְׂרָאֵל חֹק וּמִשְׁפָּֽט׃
        </p>
      </blockquote>
      <blockquote className="text-center">
        <p>
          For Ezra had set his heart to <span className="font-semibold text-primary">study</span>{" "}
          the Law of the LORD, and to do it and to teach his statutes and rules in Israel. (Ezra
          7:10)
        </p>
      </blockquote>
      <p>
        The name "Darash" is from Ezra 7:10, being the root of the word translated as "study". I
        have built the app to help develop proficiency with the biblical languages that enables
        deeper study of the scriptures. I do so with the prayer that for me and for others, like
        Ezra, we will set our hearts to study the scriptures, and having carefully studied, to both
        do it and teach it to others.
      </p>
    </div>
  );
}
