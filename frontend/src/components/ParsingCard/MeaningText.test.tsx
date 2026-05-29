import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { MeaningText } from "./MeaningText";

const html = (markup: string) => renderToStaticMarkup(<MeaningText markup={markup} />);

describe("MeaningText", () => {
  test("bold, italic, and breaks render as styled elements", () => {
    const out = html("<b>ἐν</b>, <i>prep</i><br>in");
    expect(out).toContain("<strong");
    expect(out).toContain("ἐν</strong>");
    expect(out).toContain("<em");
    expect(out).toContain("prep</em>");
    expect(out).toContain("<br/>");
  });

  test("scripture refs render as styled plain text, not a link", () => {
    const out = html("see <ref='Jhn.1.1'>Jhn.1:1</ref>");
    expect(out).toContain("Jhn.1:1");
    expect(out).toContain("meaning-ref");
    expect(out).not.toContain("<ref");
    expect(out).not.toContain("<a"); // not a link yet
  });

  test("related-words notes are kept in full", () => {
    const out = html("<re><i>SYN.</i>: θειότης</re>");
    expect(out).toContain("SYN.");
    expect(out).toContain("θειότης");
    expect(out).not.toContain("<re");
  });

  test("author/date citations are kept", () => {
    const out = html("(<author>Hom.</author>, <date>fl. 8th c. BC</date>)");
    expect(out).toContain("Hom.");
    expect(out).toContain("fl. 8th c. BC");
    expect(out).not.toContain("<author");
    expect(out).not.toContain("<date");
  });

  test("strips __ markers and unknown wrappers, keeping their text", () => {
    const out = html("__1. <re>see also <a href='x'>X</a></re>");
    expect(out).toContain("1.");
    expect(out).toContain("see also X");
    expect(out).not.toContain("__");
    expect(out).not.toContain("&lt;");
    expect(out).not.toContain("<a ");
  });
});
