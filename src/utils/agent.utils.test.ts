import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseAgentsInput,
  getInstructionsSrcPath,
  getInstructionsDestPath,
  getSkillsDirPath,
} from "./agent.utils";

describe("parseAgentsInput", () => {
  it("returns copilot for empty input", () => {
    assert.deepEqual(parseAgentsInput(""), ["copilot"]);
  });

  it("returns copilot for whitespace-only input", () => {
    assert.deepEqual(parseAgentsInput("   "), ["copilot"]);
  });

  it("matches a single agent by prefix", () => {
    assert.deepEqual(parseAgentsInput("claude"), ["claude"]);
  });

  it("matches multiple comma-separated agents", () => {
    assert.deepEqual(parseAgentsInput("copilot,claude"), ["copilot", "claude"]);
  });

  it("falls back to copilot when no agent matches", () => {
    assert.deepEqual(parseAgentsInput("unknown"), ["copilot"]);
  });
});

describe("getInstructionsSrcPath", () => {
  it("returns the claude instructions source path", () => {
    assert.equal(
      getInstructionsSrcPath("claude", "/repo/.github"),
      "/repo/.github/agent-instructions/claude.md",
    );
  });

  it("returns the codex instructions source path", () => {
    assert.equal(
      getInstructionsSrcPath("codex", "/repo/.github"),
      "/repo/.github/agent-instructions/codex.md",
    );
  });

  it("returns the copilot instructions source path", () => {
    assert.equal(
      getInstructionsSrcPath("copilot", "/repo/.github"),
      "/repo/.github/copilot-instructions.md",
    );
  });
});

describe("getInstructionsDestPath", () => {
  it("returns CLAUDE.md for claude", () => {
    assert.equal(
      getInstructionsDestPath("claude", "/project"),
      "/project/CLAUDE.md",
    );
  });

  it("returns AGENTS.md for codex", () => {
    assert.equal(
      getInstructionsDestPath("codex", "/project"),
      "/project/AGENTS.md",
    );
  });

  it("returns .github/copilot-instructions.md for copilot", () => {
    assert.equal(
      getInstructionsDestPath("copilot", "/project"),
      "/project/.github/copilot-instructions.md",
    );
  });
});

describe("getSkillsDirPath", () => {
  it("returns .claude/skills for claude", () => {
    assert.equal(
      getSkillsDirPath("claude", "/project"),
      "/project/.claude/skills",
    );
  });

  it("returns .agents/skills for codex", () => {
    assert.equal(
      getSkillsDirPath("codex", "/project"),
      "/project/.agents/skills",
    );
  });

  it("returns .github/skills for copilot", () => {
    assert.equal(
      getSkillsDirPath("copilot", "/project"),
      "/project/.github/skills",
    );
  });
});
