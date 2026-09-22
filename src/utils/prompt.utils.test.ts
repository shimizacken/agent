import { describe, it, expect } from "vitest";

import { getPromptLabel, parsePromptSelection } from "./prompt.utils";

describe("getPromptLabel", () => {
  it("strips the .prompt.md suffix", () => {
    expect(getPromptLabel("generate-plan.prompt.md")).toBe("generate-plan");
  });

  it("returns the input unchanged when there is no suffix", () => {
    expect(getPromptLabel("generate-plan")).toBe("generate-plan");
  });
});

describe("parsePromptSelection", () => {
  const prompts = ["a.prompt.md", "b.prompt.md", "c.prompt.md"];

  it("returns the prompts matching the given 1-based indices", () => {
    expect(parsePromptSelection("1,3", prompts)).toEqual([
      "a.prompt.md",
      "c.prompt.md",
    ]);
  });

  it("ignores out-of-range and non-numeric indices", () => {
    expect(parsePromptSelection("0,4,foo,2", prompts)).toEqual(["b.prompt.md"]);
  });

  it("returns an empty array for empty input", () => {
    expect(parsePromptSelection("", prompts)).toEqual([]);
  });
});
