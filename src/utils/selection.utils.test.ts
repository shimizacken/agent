import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getSelectionKey, getRemovedItems } from "./selection.utils";

describe("getSelectionKey", () => {
  it("joins the type and value with a colon", () => {
    assert.equal(getSelectionKey("skill", "shortcuts"), "skill:shortcuts");
  });

  it("distinguishes skills and prompts with the same value", () => {
    assert.notEqual(
      getSelectionKey("skill", "generate-plan"),
      getSelectionKey("prompt", "generate-plan"),
    );
  });
});

describe("getRemovedItems", () => {
  it("returns items present before but not in the final list", () => {
    assert.deepEqual(getRemovedItems(["a", "b", "c"], ["b"]), ["a", "c"]);
  });

  it("returns an empty array when nothing was removed", () => {
    assert.deepEqual(getRemovedItems(["a", "b"], ["a", "b", "c"]), []);
  });

  it("returns an empty array when there was nothing existing", () => {
    assert.deepEqual(getRemovedItems([], ["a"]), []);
  });
});
