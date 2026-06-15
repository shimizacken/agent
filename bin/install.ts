#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";

// --- pure helpers ---

const AGENTS = ["copilot", "claude", "codex"] as const;

type Agent = (typeof AGENTS)[number];

interface Prompter {
  ask: (question: string) => Promise<string>;
  close: () => void;
}

const parseAgentsInput = (raw: string): Agent[] => {
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

const instructionsSrc = (agent: Agent, srcGithub: string): string => {
  if (agent === "claude") {
    return path.join(srcGithub, "agent-instructions", "claude.md");
  }

  if (agent === "codex") {
    return path.join(srcGithub, "agent-instructions", "codex.md");
  }

  return path.join(srcGithub, "copilot-instructions.md");
};

const instructionsDest = (agent: Agent, cwd: string): string => {
  if (agent === "claude") {
    return path.join(cwd, "CLAUDE.md");
  }

  if (agent === "codex") {
    return path.join(cwd, "AGENTS.md");
  }

  return path.join(cwd, ".github", "copilot-instructions.md");
};

const skillsDir = (agent: Agent, cwd: string): string => {
  if (agent === "claude") {
    return path.join(cwd, ".claude", "skills");
  }

  if (agent === "codex") {
    return path.join(cwd, ".agents", "skills");
  }

  return path.join(cwd, ".github", "skills");
};

const listSkills = (srcBase: string): string[] =>
  fs
    .readdirSync(srcBase, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

const parseSkillSelection = (raw: string, skills: string[]): string[] => {
  const indices = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => !isNaN(i) && i >= 0 && i < skills.length);

  return indices.map((i) => skills[i]);
};

// --- side effects ---

const createPrompter = (): Prompter => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const buffer: string[] = [];
  const waiters: Array<(line: string) => void> = [];

  rl.on("line", (line) => {
    if (waiters.length > 0) {
      waiters.shift()!(line);
    } else {
      buffer.push(line);
    }
  });

  const ask = (question: string): Promise<string> =>
    new Promise((resolve) => {
      process.stdout.write(question);

      if (buffer.length > 0) {
        resolve(buffer.shift()!);
      } else {
        waiters.push(resolve);
      }
    });

  return { ask, close: () => rl.close() };
};

const copyInstructions = (srcPath: string, destPath: string): void => {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log(`  wrote  ${path.relative(process.cwd(), destPath)}`);
};

const copySkill = (srcBase: string, destBase: string, skill: string): void => {
  fs.cpSync(path.join(srcBase, skill), path.join(destBase, skill), {
    recursive: true,
  });
  console.log(
    `  wrote  ${path.relative(process.cwd(), path.join(destBase, skill))}/`,
  );
};

// --- prompts ---

const promptAgent = async (prompter: Prompter): Promise<Agent[]> => {
  const raw = await prompter.ask(
    "Agent(s) [copilot/claude/codex] (default: copilot, comma-separated for multiple): ",
  );

  return parseAgentsInput(raw);
};

const promptSkills = async (
  prompter: Prompter,
  skills: string[],
): Promise<string[]> => {
  const allAnswer = await prompter.ask(
    `Install all ${skills.length} skills? [Y/n]: `,
  );

  if (allAnswer.trim().toLowerCase() !== "n") {
    return skills;
  }

  console.log("\nAvailable skills:");
  skills.forEach((s, i) => console.log(`  ${i + 1}) ${s}`));

  const selection = await prompter.ask(
    "\nEnter numbers to install (e.g. 1,3): ",
  );

  return parseSkillSelection(selection, skills);
};

// --- main ---

const main = async (): Promise<void> => {
  const prompter = createPrompter();

  const srcGithub = path.join(__dirname, "..", ".github");
  const srcSkillsBase = path.join(srcGithub, "skills");
  const cwd = process.cwd();

  const agents = await promptAgent(prompter);
  const allSkills = listSkills(srcSkillsBase);
  const selectedSkills = await promptSkills(prompter, allSkills);

  prompter.close();
  console.log("");

  agents.forEach((agent) => {
    copyInstructions(
      instructionsSrc(agent, srcGithub),
      instructionsDest(agent, cwd),
    );

    const dest = skillsDir(agent, cwd);

    selectedSkills.forEach((skill) => copySkill(srcSkillsBase, dest, skill));
  });

  copyInstructions(
    path.join(__dirname, "..", "AGENT.md"),
    path.join(cwd, "AGENT.md"),
  );

  const totalItems = agents.length * (1 + selectedSkills.length) + 1;

  console.log(
    `\ndone - ${totalItems} item(s) installed for ${agents.join(", ")}`,
  );
};

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
