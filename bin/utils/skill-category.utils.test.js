"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const skill_category_utils_1 = require("./skill-category.utils");
(0, vitest_1.describe)("categorizeSkills", () => {
    (0, vitest_1.it)("groups skills into their matching category", () => {
        const result = (0, skill_category_utils_1.categorizeSkills)([
            "conventional-commits",
            "code-change",
            "react-formatting",
            "vue-refactor",
            "angular-formatting",
        ]);
        (0, vitest_1.expect)(result).toEqual({
            nonCode: ["conventional-commits"],
            coreCode: ["code-change"],
            react: ["react-formatting"],
            vue: ["vue-refactor"],
            angular: ["angular-formatting"],
        });
    });
    (0, vitest_1.it)("returns empty categories for an empty list", () => {
        (0, vitest_1.expect)((0, skill_category_utils_1.categorizeSkills)([])).toEqual({
            nonCode: [],
            coreCode: [],
            react: [],
            vue: [],
            angular: [],
        });
    });
    (0, vitest_1.it)("treats an unknown skill as core code", () => {
        const result = (0, skill_category_utils_1.categorizeSkills)(["some-new-skill"]);
        (0, vitest_1.expect)(result.coreCode).toEqual(["some-new-skill"]);
    });
});
(0, vitest_1.describe)("NON_CODE_SKILLS", () => {
    (0, vitest_1.it)("contains the known non-code skill names", () => {
        (0, vitest_1.expect)(skill_category_utils_1.NON_CODE_SKILLS.has("shortcuts")).toBe(true);
        (0, vitest_1.expect)(skill_category_utils_1.NON_CODE_SKILLS.has("code-change")).toBe(false);
    });
});
