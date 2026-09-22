import path from "path";

import { AGENTS } from "../cli.types";
import type { Agent } from "../cli.types";

export const parseAgentsInput = (raw: string): Agent[] => {
  const input = raw.trim().toLowerCase();

  if (!input) {
    return ["copilot"];
  }

  const matched = input
    .split(",")
    .map((s) => AGENTS.find((a) => a.startsWith(s.trim())))
    .filter((a): a is Agent => a !== undefined);

  return matched.length > 0 ? matched : ["copilot"];
};

export const getInstructionsSrcPath = (
  agent: Agent,
  srcGithub: string,
): string => {
  if (agent === "claude") {
    return path.join(srcGithub, "agent-instructions", "claude.md");
  }

  if (agent === "codex") {
    return path.join(srcGithub, "agent-instructions", "codex.md");
  }

  return path.join(srcGithub, "copilot-instructions.md");
};

export const getInstructionsDestPath = (agent: Agent, cwd: string): string => {
  if (agent === "claude") {
    return path.join(cwd, "CLAUDE.md");
  }

  if (agent === "codex") {
    return path.join(cwd, "AGENTS.md");
  }

  return path.join(cwd, ".github", "copilot-instructions.md");
};

export const getSkillsDirPath = (agent: Agent, cwd: string): string => {
  if (agent === "claude") {
    return path.join(cwd, ".claude", "skills");
  }

  if (agent === "codex") {
    return path.join(cwd, ".agents", "skills");
  }

  return path.join(cwd, ".github", "skills");
};
