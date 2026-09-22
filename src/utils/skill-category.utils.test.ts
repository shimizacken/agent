import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { categorizeSkills, NON_CODE_SKILLS } from "./skill-category.utils";

describe("categorizeSkills", () => {
  it("groups skills into their matching category", () => {
    const result = categorizeSkills([
      "conventional-commits",
      "code-change",
      "react-formatting",
      "vue-refactor",
      "angular-formatting",
    ]);

    assert.deepEqual(result, {
      nonCode: ["conventional-commits"],
      coreCode: ["code-change"],
      react: ["react-formatting"],
      vue: ["vue-refactor"],
      angular: ["angular-formatting"],
    });
  });

  it("returns empty categories for an empty list", () => {
    assert.deepEqual(categorizeSkills([]), {
      nonCode: [],
      coreCode: [],
      react: [],
      vue: [],
      angular: [],
    });
  });

  it("treats an unknown skill as core code", () => {
    const result = categorizeSkills(["some-new-skill"]);

    assert.deepEqual(result.coreCode, ["some-new-skill"]);
  });
});

describe("NON_CODE_SKILLS", () => {
  it("contains the known non-code skill names", () => {
    assert.ok(NON_CODE_SKILLS.has("shortcuts"));
    assert.ok(!NON_CODE_SKILLS.has("code-change"));
  });
});
