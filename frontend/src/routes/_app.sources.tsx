import { createFileRoute } from "@tanstack/react-router";
import { Attribution } from "@/components/Attribution";

export const Route = createFileRoute("/_app/sources")({
  component: Sources,
});

const linkClass = "text-primary hover:text-primary-hover transition-colors";

function MorphgntLink() {
  return (
    <a
      href="https://github.com/morphgnt/sblgnt"
      target="_blank"
      rel="noreferrer"
      className={linkClass}
    >
      J. K. Tauber (ed)
    </a>
  );
}

function MorphgntAttribution() {
  return (
    <Attribution
      title="MorphGNT SBLGNT"
      by={<MorphgntLink />}
      license={{
        label: "CC BY-SA 3.0",
        url: "https://creativecommons.org/licenses/by-sa/3.0/",
        components: ["by", "sa"],
      }}
    />
  );
}

function Sources() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <h1 className="font-display text-2xl font-semibold text-primary">Sources</h1>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-primary">Old Testament</h2>

        <section className="space-y-2">
          <h3 className="font-semibold">Hebrew text, morphology, and glosses</h3>
          <p>
            The Hebrew text, morphological tagging, and glosses are from TAHOT (Translators
            Amalgamated Hebrew Old Testament), part of the{" "}
            <a
              href="https://github.com/STEPBible/STEPBible-Data"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              STEPBible-Data
            </a>{" "}
            project from Tyndale House, Cambridge.
          </p>
          <Attribution
            title={
              <a
                href="https://github.com/STEPBible/STEPBible-Data"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                TAHOT
              </a>
            }
            by="Tyndale House, Cambridge / STEPBible"
            license={{
              label: "CC BY 4.0",
              url: "https://creativecommons.org/licenses/by/4.0/",
              components: ["by"],
            }}
          />
        </section>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-primary">New Testament</h2>

        <section className="space-y-2">
          <h3 className="font-semibold">Morphology and tagging</h3>
          <p>
            The morphological parsing and lemmatization are from the{" "}
            <a href="https://morphgnt.org" target="_blank" rel="noreferrer" className={linkClass}>
              MorphGNT
            </a>{" "}
            project. Thanks to{" "}
            <a href="https://jktauber.com" target="_blank" rel="noreferrer" className={linkClass}>
              James Tauber
            </a>{" "}
            and others for this tagging and making it available.
          </p>
          <MorphgntAttribution />
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">Underlying Greek text edition</h3>
          <p>
            The Greek text is the SBL Greek New Testament (SBLGNT), edited by Michael W. Holmes.
          </p>
          <Attribution
            title={
              <a href="https://sblgnt.com" target="_blank" rel="noreferrer" className={linkClass}>
                SBL Greek New Testament
              </a>
            }
            by="Michael W. Holmes"
            license={{
              label: "CC BY 4.0",
              url: "https://creativecommons.org/licenses/by/4.0/",
              components: ["by"],
            }}
          />
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">Paragraphs</h3>
          <p>
            Paragraph divisions for the MorphGNT dataset, based on SBLGNT, are from the{" "}
            <a
              href="https://github.com/jtauber/vocabulary-tools/tree/master/gnt_data"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              gnt_data
            </a>{" "}
            dataset by{" "}
            <a href="https://jktauber.com" target="_blank" rel="noreferrer" className={linkClass}>
              James Tauber
            </a>
          </p>
          <p className="text-sm">MIT License</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">Glosses and definitions</h3>
          <p>
            Glosses and definitions are from TBESG (Translators Brief lexicon of Extended Strongs
            for Greek), part of the{" "}
            <a
              href="https://github.com/STEPBible/STEPBible-Data/tree/master/Lexicons"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              STEPBible-Data
            </a>{" "}
            lexicons.
          </p>
          <Attribution
            title={
              <a
                href="https://github.com/STEPBible/STEPBible-Data"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                STEPBible-Data
              </a>
            }
            by={
              <a
                href="https://www.stepbible.org"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                STEP Bible
              </a>
            }
            license={{
              label: "CC BY 4.0",
              url: "https://creativecommons.org/licenses/by/4.0/",
              components: ["by"],
            }}
          />
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">Additional alignment</h3>
          <p>Additional alignment of forms between MorphGNT and TBESG by Andy Holt.</p>
          <p>
            List of lexical forms in MorphGNT and corresponding lexical forms in TBESG is available{" "}
            <a
              href="https://github.com/AndyHolt/darash/blob/main/ingest/src/tbesg/data/aligned_forms.csv"
              target="_blank"
              rel="license noreferrer"
              className={linkClass}
            >
              on GitHub
            </a>
            .
          </p>
          <p>
            These primarily consist of differences in use of active vs middle/passive forms for the
            lexical form (so called “deponents”), accent or breathing differences, minor spelling
            differences, or differences in transliterated forms.
          </p>
        </section>
      </section>

      <hr className="border-border" />
      <p className="text-sm text-sidebar-muted-foreground">
        Creative Commons icons by{" "}
        <a href="https://fontawesome.com" target="_blank" rel="noreferrer" className={linkClass}>
          Font Awesome
        </a>
        , used under{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="license noreferrer"
          className={linkClass}
        >
          CC BY 4.0
        </a>
        .
      </p>
    </div>
  );
}
