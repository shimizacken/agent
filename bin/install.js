#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// --- pure helpers ---

const AGENTS = ["copilot", "claude", "codex"];

const parseAgentInput = (raw) => {
  const input = raw.trim().toLowerCase();

  if (!input) {
    return "copilot";
  }

  return AGENTS.find((a) => a.startsWith(input)) ?? "copilot";
};

const instructionsDest = (agent, cwd) => {
  if (agent === "claude") {
    return path.join(cwd, "CLAUDE.md");
  }

  if (agent === "codex") {
    return path.join(cwd, "AGENTS.md");
  }

  return path.join(cwd, ".github", "copilot-instructions.md");
};

const listSkills = (srcBase) =>
  fs
    .readdirSync(srcBase, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

const parseSkillSelection = (raw, skills) => {
  const indices = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => !isNaN(i) && i >= 0 && i < skills.length);

  return indices.map((i) => skills[i]);
};

// --- side effects ---

const createPrompter = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const buffer = [];
  const waiters = [];

  rl.on("line", (line) => {
    if (waiters.length > 0) {
      waiters.shift()(line);
    } else {
      buffer.push(line);
    }
  });

  const ask = (question) =>
    new Promise((resolve) => {
      process.stdout.write(question);

      if (buffer.length > 0) {
        resolve(buffer.shift());
      } else {
        waiters.push(resolve);
      }
    });

  return { ask, close: () => rl.close() };
};

const copyInstructions = (srcPath, destPath) => {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log(`  wrote  ${path.relative(process.cwd(), destPath)}`);
};

const copySkill = (srcBase, destBase, skill) => {
  fs.cpSync(path.join(srcBase, skill), path.join(destBase, skill), {
    recursive: true,
  });
  console.log(`  wrote  .github/skills/${skill}/`);
};

// --- prompts ---

const promptAgent = async (prompter) => {
  const raw = await prompter.ask(
    "Agent [copilot/claude/codex] (default: copilot): ",
  );

  return parseAgentInput(raw);
};

const promptSkills = async (prompter, skills) => {
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

const main = async () => {
  const prompter = createPrompter();

  const srcGithub = path.join(__dirname, "..", ".github");
  const srcInstructions = path.join(srcGithub, "copilot-instructions.md");
  const srcSkillsBase = path.join(srcGithub, "skills");
  const cwd = process.cwd();

  const agent = await promptAgent(prompter);
  const allSkills = listSkills(srcSkillsBase);
  const selectedSkills = await promptSkills(prompter, allSkills);

  prompter.close();
  console.log("");

  copyInstructions(srcInstructions, instructionsDest(agent, cwd));

  const destSkillsBase = path.join(cwd, ".github", "skills");

  selectedSkills.forEach((skill) =>
    copySkill(srcSkillsBase, destSkillsBase, skill),
  );

  console.log(
    `\ndone - ${1 + selectedSkills.length} item(s) installed for ${agent}`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
