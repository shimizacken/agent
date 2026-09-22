import { describe, it, expect } from "vitest";

import { categorizeSkills, NON_CODE_SKILLS } from "./skillCategory.utils";

describe("categorizeSkills", () => {
  it("groups skills into their matching category", () => {
    const result = categorizeSkills([
      "conventional-commits",
      "code-change",
      "react-formatting",
      "vue-refactor",
      "angular-formatting",
    ]);

    expect(result).toEqual({
      nonCode: ["conventional-commits"],
      coreCode: ["code-change"],
      react: ["react-formatting"],
      vue: ["vue-refactor"],
      angular: ["angular-formatting"],
    });
  });

  it("returns empty categories for an empty list", () => {
    expect(categorizeSkills([])).toEqual({
      nonCode: [],
      coreCode: [],
      react: [],
      vue: [],
      angular: [],
    });
  });

  it("treats an unknown skill as core code", () => {
    const result = categorizeSkills(["some-new-skill"]);

    expect(result.coreCode).toEqual(["some-new-skill"]);
  });
});

describe("NON_CODE_SKILLS", () => {
  it("contains the known non-code skill names", () => {
    expect(NON_CODE_SKILLS.has("shortcuts")).toBe(true);
    expect(NON_CODE_SKILLS.has("code-change")).toBe(false);
  });
});
