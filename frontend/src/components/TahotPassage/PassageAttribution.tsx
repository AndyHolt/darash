import { Link } from "@tanstack/react-router";

const linkClass = "hover:text-primary-hover transition-colors";

export function PassageAttribution() {
  return (
    <p className="text-xs text-muted-foreground mt-6 pt-3 border-t border-border">
      Hebrew text and morphology:{" "}
      <a
        href="https://github.com/STEPBible/STEPBible-Data"
        target="_blank"
        rel="noreferrer"
        className={linkClass}
      >
        TAHOT
      </a>{" "}
      (Translators Amalgamated Hebrew OT) by Tyndale House / STEPBible (
      <a
        href="https://creativecommons.org/licenses/by/4.0/"
        target="_blank"
        rel="license noreferrer"
        className={linkClass}
      >
        CC BY 4.0
      </a>
      ).{" "}
      <Link to="/sources" className={linkClass}>
        Full sources
      </Link>
      .
    </p>
  );
}
