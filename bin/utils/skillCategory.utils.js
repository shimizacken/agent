"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorizeSkills = exports.NON_CODE_SKILLS = void 0;
exports.NON_CODE_SKILLS = new Set([
    "conventional-commits",
    "git-commits",
    "incremental-implementation",
    "incremental-planning",
    "shortcuts",
]);
const categorizeSkills = (allSkills) => {
    const nonCode = allSkills.filter((skill) => exports.NON_CODE_SKILLS.has(skill));
    const react = allSkills.filter((skill) => skill.startsWith("react-"));
    const vue = allSkills.filter((skill) => skill.startsWith("vue-"));
    const angular = allSkills.filter((skill) => skill.startsWith("angular-"));
    const coreCode = allSkills.filter((skill) => !exports.NON_CODE_SKILLS.has(skill) &&
        !react.includes(skill) &&
        !vue.includes(skill) &&
        !angular.includes(skill));
    return { nonCode, coreCode, react, vue, angular };
};
exports.categorizeSkills = categorizeSkills;
