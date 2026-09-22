"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const skill_category_utils_1 = require("./skill-category.utils");
(0, node_test_1.describe)("categorizeSkills", () => {
    (0, node_test_1.it)("groups skills into their matching category", () => {
        const result = (0, skill_category_utils_1.categorizeSkills)([
            "conventional-commits",
            "code-change",
            "react-formatting",
            "vue-refactor",
            "angular-formatting",
        ]);
        strict_1.default.deepEqual(result, {
            nonCode: ["conventional-commits"],
            coreCode: ["code-change"],
            react: ["react-formatting"],
            vue: ["vue-refactor"],
            angular: ["angular-formatting"],
        });
    });
    (0, node_test_1.it)("returns empty categories for an empty list", () => {
        strict_1.default.deepEqual((0, skill_category_utils_1.categorizeSkills)([]), {
            nonCode: [],
            coreCode: [],
            react: [],
            vue: [],
            angular: [],
        });
    });
    (0, node_test_1.it)("treats an unknown skill as core code", () => {
        const result = (0, skill_category_utils_1.categorizeSkills)(["some-new-skill"]);
        strict_1.default.deepEqual(result.coreCode, ["some-new-skill"]);
    });
});
(0, node_test_1.describe)("NON_CODE_SKILLS", () => {
    (0, node_test_1.it)("contains the known non-code skill names", () => {
        strict_1.default.ok(skill_category_utils_1.NON_CODE_SKILLS.has("shortcuts"));
        strict_1.default.ok(!skill_category_utils_1.NON_CODE_SKILLS.has("code-change"));
    });
});
