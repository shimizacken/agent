import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getPromptLabel, parsePromptSelection } from "./prompt.utils";

describe("getPromptLabel", () => {
  it("strips the .prompt.md suffix", () => {
    assert.equal(getPromptLabel("generate-plan.prompt.md"), "generate-plan");
  });

  it("returns the input unchanged when there is no suffix", () => {
    assert.equal(getPromptLabel("generate-plan"), "generate-plan");
  });
});

describe("parsePromptSelection", () => {
  const prompts = ["a.prompt.md", "b.prompt.md", "c.prompt.md"];

  it("returns the prompts matching the given 1-based indices", () => {
    assert.deepEqual(parsePromptSelection("1,3", prompts), [
      "a.prompt.md",
      "c.prompt.md",
    ]);
  });

  it("ignores out-of-range and non-numeric indices", () => {
    assert.deepEqual(parsePromptSelection("0,4,foo,2", prompts), [
      "b.prompt.md",
    ]);
  });

  it("returns an empty array for empty input", () => {
    assert.deepEqual(parsePromptSelection("", prompts), []);
  });
});
