"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const prompt_utils_1 = require("./prompt.utils");
(0, vitest_1.describe)("getPromptLabel", () => {
    (0, vitest_1.it)("strips the .prompt.md suffix", () => {
        (0, vitest_1.expect)((0, prompt_utils_1.getPromptLabel)("generate-plan.prompt.md")).toBe("generate-plan");
    });
    (0, vitest_1.it)("returns the input unchanged when there is no suffix", () => {
        (0, vitest_1.expect)((0, prompt_utils_1.getPromptLabel)("generate-plan")).toBe("generate-plan");
    });
});
(0, vitest_1.describe)("parsePromptSelection", () => {
    const prompts = ["a.prompt.md", "b.prompt.md", "c.prompt.md"];
    (0, vitest_1.it)("returns the prompts matching the given 1-based indices", () => {
        (0, vitest_1.expect)((0, prompt_utils_1.parsePromptSelection)("1,3", prompts)).toEqual([
            "a.prompt.md",
            "c.prompt.md",
        ]);
    });
    (0, vitest_1.it)("ignores out-of-range and non-numeric indices", () => {
        (0, vitest_1.expect)((0, prompt_utils_1.parsePromptSelection)("0,4,foo,2", prompts)).toEqual([
            "b.prompt.md",
        ]);
    });
    (0, vitest_1.it)("returns an empty array for empty input", () => {
        (0, vitest_1.expect)((0, prompt_utils_1.parsePromptSelection)("", prompts)).toEqual([]);
    });
});
