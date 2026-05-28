import type { ReactNode } from "react";
import { CcByIcon, CcIcon, CcSaIcon } from "./CcIcons";

const LICENSE_ICONS = {
  cc: CcIcon,
  by: CcByIcon,
  sa: CcSaIcon,
} as const;

type LicenseComponent = keyof typeof LICENSE_ICONS;

interface CcLicense {
  /** Human-readable name shown next to the glyphs, e.g. "CC BY-SA 3.0". */
  label: string;
  /** Deed URL, e.g. "https://creativecommons.org/licenses/by-sa/3.0/". */
  url: string;
  /** License glyphs to show, in order. "cc" is prepended automatically. */
  components: LicenseComponent[];
}

interface AttributionProps {
  license: CcLicense;
  /** Optional work title (the "T" in CC's TASL). */
  title?: ReactNode;
  /** Optional author/source (the "A"/"S"), e.g. a linked name. */
  by?: ReactNode;
  className?: string;
}

/**
 * Renders a Creative Commons attribution following CC's recommended TASL
 * pattern, with the license name linked to its deed via `rel="license"`.
 * The glyph row is decorative; the visible label is the link's accessible name.
 */
export function Attribution({ license, title, by, className }: AttributionProps) {
  const glyphs: LicenseComponent[] = license.components.includes("cc")
    ? license.components
    : ["cc", ...license.components];

  return (
    <p className={`text-sm ${className ?? ""}`.trim()}>
      {title}
      {title && by ? " by " : null}
      {by}
      {title || by ? " is licensed under " : "Licensed under "}
      <a
        href={license.url}
        target="_blank"
        rel="license noreferrer"
        className="inline-flex items-baseline gap-1 text-primary hover:text-primary-hover transition-colors"
      >
        <span className="inline-flex items-center gap-0.5 self-center">
          {glyphs.map((c) => {
            const Glyph = LICENSE_ICONS[c];
            return <Glyph key={c} className="size-4" />;
          })}
        </span>
        <span>{license.label}</span>
      </a>
      .
    </p>
  );
}
