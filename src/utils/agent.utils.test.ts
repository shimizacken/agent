import { describe, it, expect } from "vitest";

import {
  parseAgentsInput,
  getInstructionsSrcPath,
  getInstructionsDestPath,
  getSkillsDirPath,
} from "./agent.utils";

describe("parseAgentsInput", () => {
  it("returns copilot for empty input", () => {
    expect(parseAgentsInput("")).toEqual(["copilot"]);
  });

  it("returns copilot for whitespace-only input", () => {
    expect(parseAgentsInput("   ")).toEqual(["copilot"]);
  });

  it("matches a single agent by prefix", () => {
    expect(parseAgentsInput("claude")).toEqual(["claude"]);
  });

  it("matches multiple comma-separated agents", () => {
    expect(parseAgentsInput("copilot,claude")).toEqual(["copilot", "claude"]);
  });

  it("falls back to copilot when no agent matches", () => {
    expect(parseAgentsInput("unknown")).toEqual(["copilot"]);
  });
});

describe("getInstructionsSrcPath", () => {
  it("returns the claude instructions source path", () => {
    expect(getInstructionsSrcPath("claude", "/repo/.github")).toBe(
      "/repo/.github/agent-instructions/claude.md",
    );
  });

  it("returns the codex instructions source path", () => {
    expect(getInstructionsSrcPath("codex", "/repo/.github")).toBe(
      "/repo/.github/agent-instructions/codex.md",
    );
  });

  it("returns the copilot instructions source path", () => {
    expect(getInstructionsSrcPath("copilot", "/repo/.github")).toBe(
      "/repo/.github/copilot-instructions.md",
    );
  });
});

describe("getInstructionsDestPath", () => {
  it("returns CLAUDE.md for claude", () => {
    expect(getInstructionsDestPath("claude", "/project")).toBe(
      "/project/CLAUDE.md",
    );
  });

  it("returns AGENTS.md for codex", () => {
    expect(getInstructionsDestPath("codex", "/project")).toBe(
      "/project/AGENTS.md",
    );
  });

  it("returns .github/copilot-instructions.md for copilot", () => {
    expect(getInstructionsDestPath("copilot", "/project")).toBe(
      "/project/.github/copilot-instructions.md",
    );
  });
});

describe("getSkillsDirPath", () => {
  it("returns .claude/skills for claude", () => {
    expect(getSkillsDirPath("claude", "/project")).toBe(
      "/project/.claude/skills",
    );
  });

  it("returns .agents/skills for codex", () => {
    expect(getSkillsDirPath("codex", "/project")).toBe(
      "/project/.agents/skills",
    );
  });

  it("returns .github/skills for copilot", () => {
    expect(getSkillsDirPath("copilot", "/project")).toBe(
      "/project/.github/skills",
    );
  });
});
