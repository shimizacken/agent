#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";

// --- pure helpers ---

const AGENTS = ["copilot", "claude", "codex"] as const;

type Agent = (typeof AGENTS)[number];

const NON_CODE_SKILLS = new Set([
  "code-change",
  "conventional-commits",
  "git-commits",
  "incremental-implementation",
  "incremental-planning",
  "shortcuts",
]);

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

const copyCopilotDirectory = (
  srcGithub: string,
  cwd: string,
  directory: "instructions" | "prompts",
): void => {
  const source = path.join(srcGithub, directory);
  const destination = path.join(cwd, ".github", directory);

  fs.cpSync(source, destination, { recursive: true });

  console.log(`  wrote  ${path.relative(process.cwd(), destination)}/`);
};

// --- interactive TTY agent selector ---

const ttySelectAgents = (): Promise<Agent[]> => {
  const options: Array<{ value: Agent; label: string }> = [
    { value: "copilot", label: "copilot (default)" },
    { value: "claude", label: "claude" },
    { value: "codex", label: "codex" },
  ];

  const selected = new Set<Agent>();
  let cursor = 0;
  let lineCount = 0;

  const { stdin, stdout } = process;

  const renderList = () => {
    if (lineCount > 0) {
      stdout.write(`\x1b[${lineCount}A\x1b[0J`);
    }

    const lines = [
      "  Select agent(s)  \x1b[2m(↑↓ navigate · space toggle · enter confirm)\x1b[0m",
      ...options.map((opt, i) => {
        const pointer = i === cursor ? "\x1b[36m>\x1b[0m" : " ";
        const check = selected.has(opt.value) ? "\x1b[32m●\x1b[0m" : "○";

        return `  ${pointer} ${check}  ${opt.label}`;
      }),
    ];

    stdout.write(lines.join("\n") + "\n");
    lineCount = lines.length;
  };

  stdout.write("\x1b[?25l");
  (stdin as NodeJS.ReadStream).setRawMode(true);
  stdin.resume();
  renderList();

  return new Promise<Agent[]>((resolve) => {
    const cleanup = (result: Agent[]) => {
      stdin.removeListener("data", onData);
      (stdin as NodeJS.ReadStream).setRawMode(false);
      stdin.pause();
      stdout.write("\x1b[?25h");

      if (lineCount > 0) {
        stdout.write(`\x1b[${lineCount}A\x1b[0J`);
      }

      stdout.write(`  agents: ${result.join(", ")}\n`);
    };

    const onData = (chunk: Buffer) => {
      const key = chunk.toString();

      if (key === "\x03") {
        cleanup([]);
        process.exit(130);
      } else if (key === "\x1b[A") {
        cursor = (cursor - 1 + options.length) % options.length;
        renderList();
      } else if (key === "\x1b[B") {
        cursor = (cursor + 1) % options.length;
        renderList();
      } else if (key === " ") {
        const val = options[cursor].value;

        if (selected.has(val)) {
          selected.delete(val);
        } else {
          selected.add(val);
        }

        renderList();
      } else if (key === "\r") {
        const result: Agent[] =
          selected.size > 0 ? [...selected] : [options[cursor].value];

        cleanup(result);
        resolve(result);
      }
    };

    stdin.on("data", onData);
  });
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
  const nonCode = skills.filter((s) => NON_CODE_SKILLS.has(s));
  const code = skills.filter((s) => !NON_CODE_SKILLS.has(s));

  const nonCodeAnswer = await prompter.ask(
    `Install ${nonCode.length} non-code skills? [Y/n]: `,
  );
  const codeAnswer = await prompter.ask(
    `Install ${code.length} code skills? [y/N]: `,
  );

  return [
    ...(nonCodeAnswer.trim().toLowerCase() !== "n" ? nonCode : []),
    ...(codeAnswer.trim().toLowerCase() === "y" ? code : []),
  ];
};

// --- interactive TTY skill selector ---

const ttySelectSkills = (allSkills: string[]): Promise<string[]> => {
  type Item =
    | { kind: "header"; label: string }
    | { kind: "option"; value: string };

  const nonCode = allSkills.filter((s) => NON_CODE_SKILLS.has(s));
  const code = allSkills.filter((s) => !NON_CODE_SKILLS.has(s));

  const items: Item[] = [
    { kind: "header", label: "Non-code" },
    ...nonCode.map((s): Item => ({ kind: "option", value: s })),
    { kind: "header", label: "Code" },
    ...code.map((s): Item => ({ kind: "option", value: s })),
  ];

  const optionIndices = items.reduce<number[]>((acc, item, i) => {
    if (item.kind === "option") { acc.push(i); }

    return acc;
  }, []);

  const selected = new Set<string>(nonCode);
  let cursorIdx = 0;
  let lineCount = 0;

  const { stdin, stdout } = process;

  const renderList = () => {
    if (lineCount > 0) { stdout.write(`\x1b[${lineCount}A\x1b[0J`); }

    const lines = [
      "  Select skills  \x1b[2m(\u2191\u2193 navigate \u00b7 space toggle \u00b7 enter confirm)\x1b[0m",
    ];

    const cursorItemIdx = optionIndices[cursorIdx];

    items.forEach((item, i) => {
      if (item.kind === "header") {
        if (i > 0) { lines.push(""); }

        lines.push(`  \x1b[2m${item.label}\x1b[0m`);
      } else {
        const isCursor = i === cursorItemIdx;
        const isSelected = selected.has(item.value);
        const pointer = isCursor ? "\x1b[36m>\x1b[0m" : " ";
        const check = isSelected ? "\x1b[32m\u25cf\x1b[0m" : "\u25cb";

        lines.push(`  ${pointer} ${check}  ${item.value}`);
      }
    });

    stdout.write(lines.join("\n") + "\n");
    lineCount = lines.length;
  };

  stdout.write("\x1b[?25l");
  (stdin as NodeJS.ReadStream).setRawMode(true);
  stdin.resume();
  renderList();

  return new Promise<string[]>((resolve) => {
    const cleanup = (result: string[]) => {
      stdin.removeListener("data", onData);
      (stdin as NodeJS.ReadStream).setRawMode(false);
      stdin.pause();
      stdout.write("\x1b[?25h");

      if (lineCount > 0) { stdout.write(`\x1b[${lineCount}A\x1b[0J`); }

      const label = result.length > 0 ? result.join(", ") : "none";

      stdout.write(`  skills: ${label}\n`);
    };

    const onData = (chunk: Buffer) => {
      const key = chunk.toString();

      if (key === "\x03") {
        cleanup([]);
        process.exit(130);
      } else if (key === "\x1b[A") {
        cursorIdx = (cursorIdx - 1 + optionIndices.length) % optionIndices.length;
        renderList();
      } else if (key === "\x1b[B") {
        cursorIdx = (cursorIdx + 1) % optionIndices.length;
        renderList();
      } else if (key === " ") {
        const item = items[optionIndices[cursorIdx]];

        if (item.kind === "option") {
          if (selected.has(item.value)) {
            selected.delete(item.value);
          } else {
            selected.add(item.value);
          }

          renderList();
        }
      } else if (key === "\r") {
        const result = [...selected];

        cleanup(result);
        resolve(result);
      }
    };

    stdin.on("data", onData);
  });
};

// --- update helpers ---

const detectInstalledAgents = (cwd: string): Agent[] =>
  AGENTS.filter((agent) => fs.existsSync(instructionsDest(agent, cwd)));

const detectInstalledSkills = (agent: Agent, cwd: string): string[] => {
  const dir = skillsDir(agent, cwd);

  if (!fs.existsSync(dir)) { return []; }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
};

// --- TTY mode selector ---

const ttySelectMode = (): Promise<"install" | "update"> => {
  type Mode = "install" | "update";

  const options: Array<{ value: Mode; label: string }> = [
    { value: "install", label: "Fresh install" },
    { value: "update", label: "Update existing" },
  ];

  let cursor = 0;
  let lineCount = 0;

  const { stdin, stdout } = process;

  const renderList = () => {
    if (lineCount > 0) { stdout.write(`\x1b[${lineCount}A\x1b[0J`); }

    const lines = [
      "  Mode  \x1b[2m(\u2191\u2193 navigate \u00b7 enter confirm)\x1b[0m",
      ...options.map((opt, i) => {
        const pointer = i === cursor ? "\x1b[36m>\x1b[0m" : " ";

        return `  ${pointer}  ${opt.label}`;
      }),
    ];

    stdout.write(lines.join("\n") + "\n");
    lineCount = lines.length;
  };

  stdout.write("\x1b[?25l");
  (stdin as NodeJS.ReadStream).setRawMode(true);
  stdin.resume();
  renderList();

  return new Promise<Mode>((resolve) => {
    const cleanup = (result: Mode) => {
      stdin.removeListener("data", onData);
      (stdin as NodeJS.ReadStream).setRawMode(false);
      stdin.pause();
      stdout.write("\x1b[?25h");

      if (lineCount > 0) { stdout.write(`\x1b[${lineCount}A\x1b[0J`); }

      stdout.write(`  mode: ${result}\n`);
    };

    const onData = (chunk: Buffer) => {
      const key = chunk.toString();

      if (key === "\x03") {
        cleanup("install");
        process.exit(130);
      } else if (key === "\x1b[A") {
        cursor = (cursor - 1 + options.length) % options.length;
        renderList();
      } else if (key === "\x1b[B") {
        cursor = (cursor + 1) % options.length;
        renderList();
      } else if (key === "\r") {
        const result = options[cursor].value;

        cleanup(result);
        resolve(result);
      }
    };

    stdin.on("data", onData);
  });
};

// --- main ---

const runInstall = (
  agents: Agent[],
  selectedSkills: string[],
  srcGithub: string,
  srcSkillsBase: string,
  cwd: string,
): void => {
  console.log("");

  agents.forEach((agent) => {
    copyInstructions(
      instructionsSrc(agent, srcGithub),
      instructionsDest(agent, cwd),
    );

    const dest = skillsDir(agent, cwd);

    selectedSkills.forEach((skill) => copySkill(srcSkillsBase, dest, skill));

    if (agent === "copilot") {
      copyCopilotDirectory(srcGithub, cwd, "instructions");
      copyCopilotDirectory(srcGithub, cwd, "prompts");
    }
  });

  copyInstructions(
    path.join(__dirname, "..", "AGENT.md"),
    path.join(cwd, "AGENT.md"),
  );

  const totalItems = agents.length * (1 + selectedSkills.length) + 1;

  console.log(`\ndone - ${totalItems} item(s) installed for ${agents.join(", ")}`);
};

const runUpdate = (srcGithub: string, srcSkillsBase: string, cwd: string): void => {
  const agents = detectInstalledAgents(cwd);

  if (agents.length === 0) {
    console.log("  nothing found to update - run a fresh install first");
    return;
  }

  const allSourceSkills = listSkills(srcSkillsBase);

  console.log("");

  agents.forEach((agent) => {
    copyInstructions(instructionsSrc(agent, srcGithub), instructionsDest(agent, cwd));

    const dest = skillsDir(agent, cwd);
    const installed = detectInstalledSkills(agent, cwd);

    // overwrite existing skills and add new non-code ones; skip new code skills
    allSourceSkills.forEach((skill) => {
      if (installed.includes(skill) || NON_CODE_SKILLS.has(skill)) {
        copySkill(srcSkillsBase, dest, skill);
      }
    });

    if (agent === "copilot") {
      copyCopilotDirectory(srcGithub, cwd, "instructions");
      copyCopilotDirectory(srcGithub, cwd, "prompts");
    }
  });

  copyInstructions(
    path.join(__dirname, "..", "AGENT.md"),
    path.join(cwd, "AGENT.md"),
  );

  console.log(`\ndone - updated ${agents.join(", ")}`);
};

const main = async (): Promise<void> => {
  const srcGithub = path.join(__dirname, "..", ".github");
  const srcSkillsBase = path.join(__dirname, "..", ".agent", "skills");
  const cwd = process.cwd();

  if (process.stdin.isTTY) {
    const mode = await ttySelectMode();

    if (mode === "update") {
      runUpdate(srcGithub, srcSkillsBase, cwd);
      return;
    }

    const agents = await ttySelectAgents();
    const selectedSkills = await ttySelectSkills(listSkills(srcSkillsBase));

    runInstall(agents, selectedSkills, srcGithub, srcSkillsBase, cwd);
  } else {
    const prompter = createPrompter();
    const agents = await promptAgent(prompter);
    const selectedSkills = await promptSkills(prompter, listSkills(srcSkillsBase));

    prompter.close();

    runInstall(agents, selectedSkills, srcGithub, srcSkillsBase, cwd);
  }
};

main().catch((err: unknown) => {
  console.error(err);

  process.exit(1);
});
