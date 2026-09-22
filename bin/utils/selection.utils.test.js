"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const selection_utils_1 = require("./selection.utils");
(0, node_test_1.describe)("getSelectionKey", () => {
    (0, node_test_1.it)("joins the type and value with a colon", () => {
        strict_1.default.equal((0, selection_utils_1.getSelectionKey)("skill", "shortcuts"), "skill:shortcuts");
    });
    (0, node_test_1.it)("distinguishes skills and prompts with the same value", () => {
        strict_1.default.notEqual((0, selection_utils_1.getSelectionKey)("skill", "generate-plan"), (0, selection_utils_1.getSelectionKey)("prompt", "generate-plan"));
    });
});
(0, node_test_1.describe)("getRemovedItems", () => {
    (0, node_test_1.it)("returns items present before but not in the final list", () => {
        strict_1.default.deepEqual((0, selection_utils_1.getRemovedItems)(["a", "b", "c"], ["b"]), ["a", "c"]);
    });
    (0, node_test_1.it)("returns an empty array when nothing was removed", () => {
        strict_1.default.deepEqual((0, selection_utils_1.getRemovedItems)(["a", "b"], ["a", "b", "c"]), []);
    });
    (0, node_test_1.it)("returns an empty array when there was nothing existing", () => {
        strict_1.default.deepEqual((0, selection_utils_1.getRemovedItems)([], ["a"]), []);
    });
});
