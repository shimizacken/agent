"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const prompt_utils_1 = require("./prompt.utils");
(0, node_test_1.describe)("getPromptLabel", () => {
    (0, node_test_1.it)("strips the .prompt.md suffix", () => {
        strict_1.default.equal((0, prompt_utils_1.getPromptLabel)("generate-plan.prompt.md"), "generate-plan");
    });
    (0, node_test_1.it)("returns the input unchanged when there is no suffix", () => {
        strict_1.default.equal((0, prompt_utils_1.getPromptLabel)("generate-plan"), "generate-plan");
    });
});
(0, node_test_1.describe)("parsePromptSelection", () => {
    const prompts = ["a.prompt.md", "b.prompt.md", "c.prompt.md"];
    (0, node_test_1.it)("returns the prompts matching the given 1-based indices", () => {
        strict_1.default.deepEqual((0, prompt_utils_1.parsePromptSelection)("1,3", prompts), [
            "a.prompt.md",
            "c.prompt.md",
        ]);
    });
    (0, node_test_1.it)("ignores out-of-range and non-numeric indices", () => {
        strict_1.default.deepEqual((0, prompt_utils_1.parsePromptSelection)("0,4,foo,2", prompts), [
            "b.prompt.md",
        ]);
    });
    (0, node_test_1.it)("returns an empty array for empty input", () => {
        strict_1.default.deepEqual((0, prompt_utils_1.parsePromptSelection)("", prompts), []);
    });
});
