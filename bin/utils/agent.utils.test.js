"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const agent_utils_1 = require("./agent.utils");
(0, vitest_1.describe)("parseAgentsInput", () => {
    (0, vitest_1.it)("returns copilot for empty input", () => {
        (0, vitest_1.expect)((0, agent_utils_1.parseAgentsInput)("")).toEqual(["copilot"]);
    });
    (0, vitest_1.it)("returns copilot for whitespace-only input", () => {
        (0, vitest_1.expect)((0, agent_utils_1.parseAgentsInput)("   ")).toEqual(["copilot"]);
    });
    (0, vitest_1.it)("matches a single agent by prefix", () => {
        (0, vitest_1.expect)((0, agent_utils_1.parseAgentsInput)("claude")).toEqual(["claude"]);
    });
    (0, vitest_1.it)("matches multiple comma-separated agents", () => {
        (0, vitest_1.expect)((0, agent_utils_1.parseAgentsInput)("copilot,claude")).toEqual(["copilot", "claude"]);
    });
    (0, vitest_1.it)("falls back to copilot when no agent matches", () => {
        (0, vitest_1.expect)((0, agent_utils_1.parseAgentsInput)("unknown")).toEqual(["copilot"]);
    });
});
(0, vitest_1.describe)("getInstructionsSrcPath", () => {
    (0, vitest_1.it)("returns the claude instructions source path", () => {
        (0, vitest_1.expect)((0, agent_utils_1.getInstructionsSrcPath)("claude", "/repo/.github")).toBe("/repo/.github/agent-instructions/claude.md");
    });
    (0, vitest_1.it)("returns the codex instructions source path", () => {
        (0, vitest_1.expect)((0, agent_utils_1.getInstructionsSrcPath)("codex", "/repo/.github")).toBe("/repo/.github/agent-instructions/codex.md");
    });
    (0, vitest_1.it)("returns the copilot instructions source path", () => {
        (0, vitest_1.expect)((0, agent_utils_1.getInstructionsSrcPath)("copilot", "/repo/.github")).toBe("/repo/.github/copilot-instructions.md");
    });
});
(0, vitest_1.describe)("getInstructionsDestPath", () => {
    (0, vitest_1.it)("returns CLAUDE.md for claude", () => {
        (0, vitest_1.expect)((0, agent_utils_1.getInstructionsDestPath)("claude", "/project")).toBe("/project/CLAUDE.md");
    });
    (0, vitest_1.it)("returns AGENTS.md for codex", () => {
        (0, vitest_1.expect)((0, agent_utils_1.getInstructionsDestPath)("codex", "/project")).toBe("/project/AGENTS.md");
    });
    (0, vitest_1.it)("returns .github/copilot-instructions.md for copilot", () => {
        (0, vitest_1.expect)((0, agent_utils_1.getInstructionsDestPath)("copilot", "/project")).toBe("/project/.github/copilot-instructions.md");
    });
});
(0, vitest_1.describe)("getSkillsDirPath", () => {
    (0, vitest_1.it)("returns .claude/skills for claude", () => {
        (0, vitest_1.expect)((0, agent_utils_1.getSkillsDirPath)("claude", "/project")).toBe("/project/.claude/skills");
    });
    (0, vitest_1.it)("returns .agents/skills for codex", () => {
        (0, vitest_1.expect)((0, agent_utils_1.getSkillsDirPath)("codex", "/project")).toBe("/project/.agents/skills");
    });
    (0, vitest_1.it)("returns .github/skills for copilot", () => {
        (0, vitest_1.expect)((0, agent_utils_1.getSkillsDirPath)("copilot", "/project")).toBe("/project/.github/skills");
    });
});
