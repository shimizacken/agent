import { describe, it, expect } from "vitest";

import { getSelectionKey, getRemovedItems } from "./selection.utils";

describe("getSelectionKey", () => {
  it("joins the type and value with a colon", () => {
    expect(getSelectionKey("skill", "shortcuts")).toBe("skill:shortcuts");
  });

  it("distinguishes skills and prompts with the same value", () => {
    expect(getSelectionKey("skill", "generate-plan")).not.toBe(
      getSelectionKey("prompt", "generate-plan"),
    );
  });
});

describe("getRemovedItems", () => {
  it("returns items present before but not in the final list", () => {
    expect(getRemovedItems(["a", "b", "c"], ["b"])).toEqual(["a", "c"]);
  });

  it("returns an empty array when nothing was removed", () => {
    expect(getRemovedItems(["a", "b"], ["a", "b", "c"])).toEqual([]);
  });

  it("returns an empty array when there was nothing existing", () => {
    expect(getRemovedItems([], ["a"])).toEqual([]);
  });
});
