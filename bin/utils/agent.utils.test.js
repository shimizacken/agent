"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const agent_utils_1 = require("./agent.utils");
(0, node_test_1.describe)("parseAgentsInput", () => {
    (0, node_test_1.it)("returns copilot for empty input", () => {
        strict_1.default.deepEqual((0, agent_utils_1.parseAgentsInput)(""), ["copilot"]);
    });
    (0, node_test_1.it)("returns copilot for whitespace-only input", () => {
        strict_1.default.deepEqual((0, agent_utils_1.parseAgentsInput)("   "), ["copilot"]);
    });
    (0, node_test_1.it)("matches a single agent by prefix", () => {
        strict_1.default.deepEqual((0, agent_utils_1.parseAgentsInput)("claude"), ["claude"]);
    });
    (0, node_test_1.it)("matches multiple comma-separated agents", () => {
        strict_1.default.deepEqual((0, agent_utils_1.parseAgentsInput)("copilot,claude"), ["copilot", "claude"]);
    });
    (0, node_test_1.it)("falls back to copilot when no agent matches", () => {
        strict_1.default.deepEqual((0, agent_utils_1.parseAgentsInput)("unknown"), ["copilot"]);
    });
});
(0, node_test_1.describe)("getInstructionsSrcPath", () => {
    (0, node_test_1.it)("returns the claude instructions source path", () => {
        strict_1.default.equal((0, agent_utils_1.getInstructionsSrcPath)("claude", "/repo/.github"), "/repo/.github/agent-instructions/claude.md");
    });
    (0, node_test_1.it)("returns the codex instructions source path", () => {
        strict_1.default.equal((0, agent_utils_1.getInstructionsSrcPath)("codex", "/repo/.github"), "/repo/.github/agent-instructions/codex.md");
    });
    (0, node_test_1.it)("returns the copilot instructions source path", () => {
        strict_1.default.equal((0, agent_utils_1.getInstructionsSrcPath)("copilot", "/repo/.github"), "/repo/.github/copilot-instructions.md");
    });
});
(0, node_test_1.describe)("getInstructionsDestPath", () => {
    (0, node_test_1.it)("returns CLAUDE.md for claude", () => {
        strict_1.default.equal((0, agent_utils_1.getInstructionsDestPath)("claude", "/project"), "/project/CLAUDE.md");
    });
    (0, node_test_1.it)("returns AGENTS.md for codex", () => {
        strict_1.default.equal((0, agent_utils_1.getInstructionsDestPath)("codex", "/project"), "/project/AGENTS.md");
    });
    (0, node_test_1.it)("returns .github/copilot-instructions.md for copilot", () => {
        strict_1.default.equal((0, agent_utils_1.getInstructionsDestPath)("copilot", "/project"), "/project/.github/copilot-instructions.md");
    });
});
(0, node_test_1.describe)("getSkillsDirPath", () => {
    (0, node_test_1.it)("returns .claude/skills for claude", () => {
        strict_1.default.equal((0, agent_utils_1.getSkillsDirPath)("claude", "/project"), "/project/.claude/skills");
    });
    (0, node_test_1.it)("returns .agents/skills for codex", () => {
        strict_1.default.equal((0, agent_utils_1.getSkillsDirPath)("codex", "/project"), "/project/.agents/skills");
    });
    (0, node_test_1.it)("returns .github/skills for copilot", () => {
        strict_1.default.equal((0, agent_utils_1.getSkillsDirPath)("copilot", "/project"), "/project/.github/skills");
    });
});
