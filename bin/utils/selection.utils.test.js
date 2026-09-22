"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const selection_utils_1 = require("./selection.utils");
(0, vitest_1.describe)("getSelectionKey", () => {
    (0, vitest_1.it)("joins the type and value with a colon", () => {
        (0, vitest_1.expect)((0, selection_utils_1.getSelectionKey)("skill", "shortcuts")).toBe("skill:shortcuts");
    });
    (0, vitest_1.it)("distinguishes skills and prompts with the same value", () => {
        (0, vitest_1.expect)((0, selection_utils_1.getSelectionKey)("skill", "generate-plan")).not.toBe((0, selection_utils_1.getSelectionKey)("prompt", "generate-plan"));
    });
});
(0, vitest_1.describe)("getRemovedItems", () => {
    (0, vitest_1.it)("returns items present before but not in the final list", () => {
        (0, vitest_1.expect)((0, selection_utils_1.getRemovedItems)(["a", "b", "c"], ["b"])).toEqual(["a", "c"]);
    });
    (0, vitest_1.it)("returns an empty array when nothing was removed", () => {
        (0, vitest_1.expect)((0, selection_utils_1.getRemovedItems)(["a", "b"], ["a", "b", "c"])).toEqual([]);
    });
    (0, vitest_1.it)("returns an empty array when there was nothing existing", () => {
        (0, vitest_1.expect)((0, selection_utils_1.getRemovedItems)([], ["a"])).toEqual([]);
    });
});
