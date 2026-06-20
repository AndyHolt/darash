import { describe, expect, test } from "vitest";
import { cleanGloss } from "./gloss";

describe("cleanGloss", () => {
  test("passes through already-clean glosses", () => {
    expect(cleanGloss("in")).toBe("in");
    expect(cleanGloss("to create")).toBe("to create");
  });

  test("strips the leading marker, sense suffix, and contextual alternate", () => {
    expect(cleanGloss(": beginning»first:1_beginning")).toBe("beginning");
    expect(cleanGloss(": spirit»spirit:1_spirit")).toBe("spirit");
  });

  test("rejoins underscore-joined multi-word glosses", () => {
    expect(cleanGloss(": country;_planet»land:2_country;_planet")).toBe("country; planet");
  });

  test("drops @ref notes", () => {
    expect(cleanGloss("God»LORD@Gen.1.1-Heb")).toBe("God");
  });

  test("handles missing gloss", () => {
    expect(cleanGloss(undefined)).toBe("");
  });
});
