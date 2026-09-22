export const NON_CODE_SKILLS = new Set([
  "conventional-commits",
  "git-commits",
  "incremental-implementation",
  "incremental-planning",
  "shortcuts",
]);

export interface SkillCategories {
  nonCode: string[];
  coreCode: string[];
  react: string[];
  vue: string[];
  angular: string[];
}

export const categorizeSkills = (allSkills: string[]): SkillCategories => {
  const nonCode = allSkills.filter((skill) => NON_CODE_SKILLS.has(skill));
  const react = allSkills.filter((skill) => skill.startsWith("react-"));
  const vue = allSkills.filter((skill) => skill.startsWith("vue-"));
  const angular = allSkills.filter((skill) => skill.startsWith("angular-"));
  const coreCode = allSkills.filter(
    (skill) =>
      !NON_CODE_SKILLS.has(skill) &&
      !react.includes(skill) &&
      !vue.includes(skill) &&
      !angular.includes(skill),
  );

  return { nonCode, coreCode, react, vue, angular };
};
