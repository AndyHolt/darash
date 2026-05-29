import { Link } from "@tanstack/react-router";

const linkClass = "hover:text-primary-hover transition-colors";

export function PassageAttribution() {
  return (
    <p className="text-xs text-muted-foreground mt-6 pt-3 border-t border-border">
      Greek text:{" "}
      <a href="https://sblgnt.com" target="_blank" rel="noreferrer" className={linkClass}>
        SBLGNT
      </a>{" "}
      by Michael W. Holmes (
      <a
        href="https://creativecommons.org/licenses/by/4.0/"
        target="_blank"
        rel="license noreferrer"
        className={linkClass}
      >
        CC BY 4.0
      </a>
      ). Morphology:{" "}
      <a href="https://morphgnt.org" target="_blank" rel="noreferrer" className={linkClass}>
        MorphGNT
      </a>{" "}
      by J. K. Tauber (
      <a
        href="https://creativecommons.org/licenses/by-sa/3.0/"
        target="_blank"
        rel="license noreferrer"
        className={linkClass}
      >
        CC BY-SA 3.0
      </a>
      ).{" "}
      <Link to="/sources" className={linkClass}>
        Full sources
      </Link>
      .
    </p>
  );
}
