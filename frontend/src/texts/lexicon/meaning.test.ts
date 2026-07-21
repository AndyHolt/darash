import { describe, expect, test } from "vitest";
import { parseMeaning } from "./meaning";

describe("parseMeaning", () => {
  test("plain text → single text node", () => {
    expect(parseMeaning("teacher")).toEqual([{ type: "text", value: "teacher" }]);
  });

  test("bold and italic become element nodes", () => {
    expect(parseMeaning("a <b>big</b> <i>red</i> dog")).toEqual([
      { type: "text", value: "a " },
      { type: "element", tag: "b", attrs: {}, children: [{ type: "text", value: "big" }] },
      { type: "text", value: " " },
      { type: "element", tag: "i", attrs: {}, children: [{ type: "text", value: "red" }] },
      { type: "text", value: " dog" },
    ]);
  });

  test("line-break tags become break nodes in all spellings", () => {
    expect(parseMeaning("a<BR />b<br>c<br />d<lb />e")).toEqual([
      { type: "text", value: "a" },
      { type: "break" },
      { type: "text", value: "b" },
      { type: "break" },
      { type: "text", value: "c" },
      { type: "break" },
      { type: "text", value: "d" },
      { type: "break" },
      { type: "text", value: "e" },
    ]);
  });

  test("ref target is captured, inner text kept", () => {
    expect(parseMeaning("see <ref='Act.20.37'>Act.20:37</ref>")).toEqual([
      { type: "text", value: "see " },
      {
        type: "element",
        tag: "ref",
        attrs: { target: "Act.20.37" },
        children: [{ type: "text", value: "Act.20:37" }],
      },
    ]);
  });

  test("anchor href/title are captured, inner text kept", () => {
    const nodes = parseMeaning('<a href="javascript:void(0)" title="Homer">Hom.</a>');
    expect(nodes).toEqual([
      {
        type: "element",
        tag: "a",
        attrs: { href: "javascript:void(0)", title: "Homer" },
        children: [{ type: "text", value: "Hom." }],
      },
    ]);
  });

  test("nested elements", () => {
    expect(parseMeaning("<re><i>SYN.</i>: word</re>")).toEqual([
      {
        type: "element",
        tag: "re",
        attrs: {},
        children: [
          { type: "element", tag: "i", attrs: {}, children: [{ type: "text", value: "SYN." }] },
          { type: "text", value: ": word" },
        ],
      },
    ]);
  });

  test("__ indentation markers are stripped", () => {
    expect(parseMeaning("__1. outside")).toEqual([{ type: "text", value: "1. outside" }]);
  });

  test("entities are decoded", () => {
    expect(parseMeaning("a &gt; b &amp; c")).toEqual([{ type: "text", value: "a > b & c" }]);
  });

  test("stray closing tag is ignored", () => {
    expect(parseMeaning("a</b>b")).toEqual([{ type: "text", value: "ab" }]);
  });

  test("unclosed tag still captures following text as children", () => {
    expect(parseMeaning("<b>bold")).toEqual([
      { type: "element", tag: "b", attrs: {}, children: [{ type: "text", value: "bold" }] },
    ]);
  });
});
