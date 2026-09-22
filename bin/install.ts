#!/usr/bin/env node

import crypto from "crypto";
import fs from "fs";
import path from "path";
import readline from "readline";

// --- pure helpers ---

const AGENTS = ["copilot", "claude", "codex"] as const;

type Agent = (typeof AGENTS)[number];

const NON_CODE_SKILLS = new Set([
  "conventional-commits",
  "git-commits",
  "incremental-implementation",
  "incremental-planning",
  "shortcuts",
]);

const MANIFEST_FILE = ".agent-manifest.json";
const MANIFEST_SOURCE = "shimizacken/agent";
const MANIFEST_SOURCE_TYPE = "github";

interface ManifestEntry {
  source: string;
  sourceType: string;
  skillPath: string;
  computedHash: string;
}

interface Manifest {
  version: 1;
  agents: Agent[];
  skills: Record<string, ManifestEntry>;
  prompts: Record<string, ManifestEntry>;
}

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

const listPromptFiles = (srcRoot: string): string[] =>
  fs
    .readdirSync(path.join(srcRoot, "prompts"), { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name);

const promptLabel = (file: string): string => file.replace(/\.prompt\.md$/, "");

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
  srcRoot: string,
  cwd: string,
  directory: "instructions" | "prompts",
): void => {
  const source = path.join(srcRoot, directory);
  const destination = path.join(cwd, ".github", directory);

  fs.cpSync(source, destination, { recursive: true });

  console.log(`  wrote  ${path.relative(process.cwd(), destination)}/`);
};

const copyPromptFile = (srcRoot: string, cwd: string, file: string): void => {
  const destination = path.join(cwd, ".github", "prompts", file);

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(srcRoot, "prompts", file), destination);

  console.log(`  wrote  ${path.relative(process.cwd(), destination)}`);
};

// --- interactive TTY agent selector ---

const ttySelectAgents = (preselected: Agent[] = []): Promise<Agent[]> => {
  const options: Array<{ value: Agent; label: string }> = [
    { value: "copilot", label: "copilot (default)" },
    { value: "claude", label: "claude" },
    { value: "codex", label: "codex" },
  ];

  const selected = new Set<Agent>(preselected);
  let cursor = Math.max(
    0,
    options.findIndex((opt) => preselected.includes(opt.value)),
  );
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

const promptPrompts = async (
  prompter: Prompter,
  prompts: string[],
): Promise<string[]> => {
  const allAnswer = await prompter.ask(
    `Install all ${prompts.length} prompts? [Y/n]: `,
  );

  if (allAnswer.trim().toLowerCase() !== "n") {
    return prompts;
  }

  console.log("\nAvailable prompts:");

  prompts.forEach((p, i) => console.log(`  ${i + 1}) ${promptLabel(p)}`));

  const selection = await prompter.ask(
    "\nEnter numbers to install (e.g. 1,3): ",
  );

  return parseSkillSelection(selection, prompts);
};

// --- interactive TTY skill selector ---

const ttySelectSkillsAndPrompts = (
  allSkills: string[],
  allPrompts: string[],
  existingSkills?: string[],
  existingPrompts?: string[],
): Promise<{ skills: string[]; prompts: string[] }> => {
  type Item =
    | { kind: "header"; label: string }
    | {
        kind: "selectAll";
        type: "skill" | "prompt";
        values: string[];
      }
    | { kind: "updateAll"; skills: string[]; prompts: string[] }
    | { kind: "option"; type: "skill" | "prompt"; value: string };

  const nonCode = allSkills.filter((s) => NON_CODE_SKILLS.has(s));
  const react = allSkills.filter((s) => s.startsWith("react-"));
  const vue = allSkills.filter((s) => s.startsWith("vue-"));
  const angular = allSkills.filter((s) => s.startsWith("angular-"));
  const coreCode = allSkills.filter(
    (s) =>
      !NON_CODE_SKILLS.has(s) &&
      !react.includes(s) &&
      !vue.includes(s) &&
      !angular.includes(s),
  );

  const sectionItems = (
    label: string,
    type: "skill" | "prompt",
    values: string[],
  ): Item[] =>
    values.length > 0
      ? [
          { kind: "header", label },
          { kind: "selectAll", type, values },
          ...values.map((value): Item => ({ kind: "option", type, value })),
        ]
      : [{ kind: "header", label }];

  const isUpdateMode =
    existingSkills !== undefined || existingPrompts !== undefined;

  const items: Item[] = [
    ...(isUpdateMode
      ? [
          {
            kind: "updateAll",
            skills: existingSkills ?? [],
            prompts: existingPrompts ?? [],
          } as Item,
        ]
      : []),
    ...sectionItems("Code conventions", "skill", nonCode),
    ...sectionItems("Core code", "skill", coreCode),
    ...sectionItems("React", "skill", react),
    ...sectionItems("Vue.js", "skill", vue),
    ...sectionItems("Angular", "skill", angular),
    ...sectionItems("Prompts", "prompt", allPrompts),
  ];

  const optionIndices = items.reduce<number[]>((acc, item, i) => {
    if (item.kind !== "header") {
      acc.push(i);
    }

    return acc;
  }, []);

  const selectionKey = (type: "skill" | "prompt", value: string) =>
    `${type}:${value}`;
  const selected = new Set<string>(
    existingSkills !== undefined || existingPrompts !== undefined
      ? [
          ...(existingSkills ?? []).map((skill) =>
            selectionKey("skill", skill),
          ),
          ...(existingPrompts ?? []).map((prompt) =>
            selectionKey("prompt", prompt),
          ),
        ]
      : [
          ...nonCode.map((skill) => selectionKey("skill", skill)),
          ...allPrompts.map((prompt) => selectionKey("prompt", prompt)),
        ],
  );
  let cursorIdx = 0;
  let lineCount = 0;
  let updateAllChecked = false;

  const { stdin, stdout } = process;

  const renderList = () => {
    if (lineCount > 0) {
      stdout.write(`\x1b[${lineCount}A\x1b[0J`);
    }

    const lines = [
      "  Select skills and prompts  \x1b[2m(\u2191\u2193 navigate \u00b7 space toggle \u00b7 enter confirm)\x1b[0m",
    ];

    const cursorItemIdx = optionIndices[cursorIdx];

    items.forEach((item, i) => {
      if (item.kind === "header") {
        if (i > 0) {
          lines.push("");
        }

        lines.push(`  \x1b[2m${item.label}\x1b[0m`);
      } else {
        const isCursor = i === cursorItemIdx;
        const isSelectAll = item.kind === "selectAll";
        const isUpdateAll = item.kind === "updateAll";
        const isSelected = isUpdateAll
          ? updateAllChecked
          : isSelectAll
            ? item.values.every((value) =>
                selected.has(selectionKey(item.type, value)),
              )
            : selected.has(selectionKey(item.type, item.value));
        const label = isUpdateAll
          ? "Update all selected skills to latest version"
          : isSelectAll
            ? "Select all"
            : item.type === "prompt"
              ? promptLabel(item.value)
              : item.value;
        const pointer = isCursor ? "\x1b[36m>\x1b[0m" : " ";
        const check = isSelected ? "\x1b[32m\u25cf\x1b[0m" : "\u25cb";

        lines.push(`  ${pointer} ${check}  ${label}`);
      }
    });

    stdout.write(lines.join("\n") + "\n");
    lineCount = lines.length;
  };

  stdout.write("\x1b[?25l");
  (stdin as NodeJS.ReadStream).setRawMode(true);
  stdin.resume();
  renderList();

  return new Promise<{ skills: string[]; prompts: string[] }>((resolve) => {
    const cleanup = (result: { skills: string[]; prompts: string[] }) => {
      stdin.removeListener("data", onData);
      (stdin as NodeJS.ReadStream).setRawMode(false);
      stdin.pause();
      stdout.write("\x1b[?25h");

      if (lineCount > 0) {
        stdout.write(`\x1b[${lineCount}A\x1b[0J`);
      }

      const skillLabel =
        result.skills.length > 0 ? result.skills.join(", ") : "none";
      const promptLabelText =
        result.prompts.length > 0
          ? result.prompts.map(promptLabel).join(", ")
          : "none";

      stdout.write(`  skills: ${skillLabel}\n`);
      stdout.write(`  prompts: ${promptLabelText}\n`);
    };

    const onData = (chunk: Buffer) => {
      const key = chunk.toString();

      if (key === "\x03") {
        cleanup({ skills: [], prompts: [] });
        process.exit(130);
      } else if (key === "\x1b[A") {
        cursorIdx =
          (cursorIdx - 1 + optionIndices.length) % optionIndices.length;
        renderList();
      } else if (key === "\x1b[B") {
        cursorIdx = (cursorIdx + 1) % optionIndices.length;
        renderList();
      } else if (key === " ") {
        const item = items[optionIndices[cursorIdx]];

        if (item.kind === "updateAll") {
          const keys = [
            ...item.skills.map((skill) => selectionKey("skill", skill)),
            ...item.prompts.map((prompt) => selectionKey("prompt", prompt)),
          ];

          updateAllChecked = !updateAllChecked;

          keys.forEach((key) => {
            if (updateAllChecked) {
              selected.add(key);
            } else {
              selected.delete(key);
            }
          });

          renderList();
        } else if (item.kind === "selectAll") {
          const isSelected = item.values.every((value) =>
            selected.has(selectionKey(item.type, value)),
          );

          item.values.forEach((value) => {
            const key = selectionKey(item.type, value);

            if (isSelected) {
              selected.delete(key);
            } else {
              selected.add(key);
            }
          });

          renderList();
        } else if (item.kind === "option") {
          const key = selectionKey(item.type, item.value);

          if (selected.has(key)) {
            selected.delete(key);
          } else {
            selected.add(key);
          }

          renderList();
        }
      } else if (key === "\r") {
        const result = items.reduce(
          (selection, item) => {
            if (item.kind === "option") {
              const key = selectionKey(item.type, item.value);

              if (selected.has(key)) {
                selection[item.type === "skill" ? "skills" : "prompts"].push(
                  item.value,
                );
              }
            }

            return selection;
          },
          { skills: [], prompts: [] } as {
            skills: string[];
            prompts: string[];
          },
        );

        cleanup(result);
        resolve(result);
      }
    };

    stdin.on("data", onData);
  });
};

// --- existing installation detection ---

const detectInstalledAgents = (cwd: string): Agent[] =>
  AGENTS.filter((agent) => fs.existsSync(instructionsDest(agent, cwd)));

const detectInstalledSkills = (agent: Agent, cwd: string): string[] => {
  const dir = skillsDir(agent, cwd);

  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
};

const computeHash = (filePath: string): string =>
  crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

const buildManifestEntry = (
  srcRoot: string,
  filePath: string,
): ManifestEntry => ({
  source: MANIFEST_SOURCE,
  sourceType: MANIFEST_SOURCE_TYPE,
  skillPath: path.relative(srcRoot, filePath),
  computedHash: computeHash(filePath),
});

const buildSkillEntries = (
  skills: string[],
  srcSkillsBase: string,
  srcRoot: string,
): Record<string, ManifestEntry> =>
  Object.fromEntries(
    skills.map((skill) => [
      skill,
      buildManifestEntry(srcRoot, path.join(srcSkillsBase, skill, "SKILL.md")),
    ]),
  );

const buildPromptEntries = (
  prompts: string[],
  srcRoot: string,
): Record<string, ManifestEntry> =>
  Object.fromEntries(
    prompts.map((file) => [
      file,
      buildManifestEntry(srcRoot, path.join(srcRoot, "prompts", file)),
    ]),
  );

const readManifest = (cwd: string): Manifest | null => {
  const manifestPath = path.join(cwd, MANIFEST_FILE);

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;
  } catch {
    return null;
  }
};

const writeManifest = (cwd: string, manifest: Manifest): void => {
  fs.writeFileSync(
    path.join(cwd, MANIFEST_FILE),
    JSON.stringify(manifest, null, 2) + "\n",
  );

  console.log(`  wrote  ${MANIFEST_FILE}`);
};

interface ExistingSelection {
  agents: Agent[];
  skills: string[];
  prompts: string[];
}

const detectExistingSelection = (
  cwd: string,
  srcRoot: string,
): ExistingSelection => {
  const manifest = readManifest(cwd);

  if (manifest) {
    return {
      agents: manifest.agents,
      skills: Object.keys(manifest.skills),
      prompts: Object.keys(manifest.prompts),
    };
  }

  const agents = detectInstalledAgents(cwd);
  const skills = [
    ...new Set(agents.flatMap((agent) => detectInstalledSkills(agent, cwd))),
  ];
  const prompts = agents.includes("copilot")
    ? listPromptFiles(srcRoot).filter((file) =>
        fs.existsSync(path.join(cwd, ".github", "prompts", file)),
      )
    : [];

  return { agents, skills, prompts };
};

// --- removal confirmation ---

const askQuestion = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const removeSkillFromAgents = (
  agents: Agent[],
  skill: string,
  cwd: string,
): void => {
  agents.forEach((agent) => {
    const target = path.join(skillsDir(agent, cwd), skill);

    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`  removed  ${path.relative(cwd, target)}/`);
    }
  });
};

const removePromptFile = (cwd: string, file: string): void => {
  const target = path.join(cwd, ".github", "prompts", file);

  if (fs.existsSync(target)) {
    fs.rmSync(target);
    console.log(`  removed  ${path.relative(cwd, target)}`);
  }
};

const removeAgentInstallation = (agent: Agent, cwd: string): void => {
  const instructions = instructionsDest(agent, cwd);

  if (fs.existsSync(instructions)) {
    fs.rmSync(instructions);
    console.log(`  removed  ${path.relative(cwd, instructions)}`);
  }

  const dir = skillsDir(agent, cwd);

  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`  removed  ${path.relative(cwd, dir)}/`);
  }
};

const confirmAndRemove = async (
  ask: (question: string) => Promise<string>,
  cwd: string,
  existing: ExistingSelection,
  finalAgents: Agent[],
  finalSkills: string[],
  finalPrompts: string[],
): Promise<void> => {
  const removedAgents = existing.agents.filter(
    (agent) => !finalAgents.includes(agent),
  );
  const removedSkills = existing.skills.filter(
    (skill) => !finalSkills.includes(skill),
  );
  const removedPrompts = existing.prompts.filter(
    (file) => !finalPrompts.includes(file),
  );

  if (
    removedAgents.length === 0 &&
    removedSkills.length === 0 &&
    removedPrompts.length === 0
  ) {
    return;
  }

  const removedLabels = [
    ...removedAgents.map((agent) => `${agent} (agent)`),
    ...removedSkills,
    ...removedPrompts.map((file) => promptLabel(file)),
  ];

  const answer = await ask(
    `\nAre you sure you want to remove the following:\n${removedLabels
      .map((label) => `  - ${label}`)
      .join("\n")}\n[y/N]: `,
  );

  if (answer.trim().toLowerCase() !== "y") {
    console.log("  skipped removal - existing files kept");
    return;
  }

  console.log("");
  removedAgents.forEach((agent) => removeAgentInstallation(agent, cwd));
  removedSkills.forEach((skill) =>
    removeSkillFromAgents(finalAgents, skill, cwd),
  );
  removedPrompts.forEach((file) => removePromptFile(cwd, file));
};

// --- main ---

const runInstall = (
  agents: Agent[],
  selectedSkills: string[],
  selectedPrompts: string[],
  srcRoot: string,
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
      copyCopilotDirectory(srcRoot, cwd, "instructions");
      selectedPrompts.forEach((file) => copyPromptFile(srcRoot, cwd, file));
    }
  });

  copyInstructions(
    path.join(__dirname, "..", "AGENT.md"),
    path.join(cwd, "AGENT.md"),
  );

  const promptItems = agents.includes("copilot") ? selectedPrompts.length : 0;
  const totalItems =
    agents.length * (1 + selectedSkills.length) + promptItems + 1;

  console.log(
    `\ndone - ${totalItems} item(s) installed for ${agents.join(", ")}`,
  );
};

const main = async (): Promise<void> => {
  const srcRoot = path.join(__dirname, "..");
  const srcGithub = path.join(srcRoot, ".github");
  const srcSkillsBase = path.join(srcRoot, "skills");
  const cwd = process.cwd();
  const existing = detectExistingSelection(cwd, srcRoot);
  const hasExisting = existing.agents.length > 0;

  if (process.stdin.isTTY) {
    const agents = hasExisting
      ? existing.agents
      : await ttySelectAgents(existing.agents);
    const selection = await ttySelectSkillsAndPrompts(
      listSkills(srcSkillsBase),
      agents.includes("copilot") ? listPromptFiles(srcRoot) : [],
      hasExisting ? existing.skills : undefined,
      hasExisting ? existing.prompts : undefined,
    );

    await confirmAndRemove(
      askQuestion,
      cwd,
      existing,
      agents,
      selection.skills,
      selection.prompts,
    );

    runInstall(
      agents,
      selection.skills,
      selection.prompts,
      srcRoot,
      srcGithub,
      srcSkillsBase,
      cwd,
    );

    writeManifest(cwd, {
      version: 1,
      agents,
      skills: buildSkillEntries(selection.skills, srcSkillsBase, srcRoot),
      prompts: buildPromptEntries(selection.prompts, srcRoot),
    });
  } else {
    const prompter = createPrompter();
    const agents = await promptAgent(prompter);
    const selectedSkills = await promptSkills(
      prompter,
      listSkills(srcSkillsBase),
    );
    const selectedPrompts = agents.includes("copilot")
      ? await promptPrompts(prompter, listPromptFiles(srcRoot))
      : [];

    await confirmAndRemove(
      prompter.ask,
      cwd,
      existing,
      agents,
      selectedSkills,
      selectedPrompts,
    );

    prompter.close();

    runInstall(
      agents,
      selectedSkills,
      selectedPrompts,
      srcRoot,
      srcGithub,
      srcSkillsBase,
      cwd,
    );

    writeManifest(cwd, {
      version: 1,
      agents,
      skills: buildSkillEntries(selectedSkills, srcSkillsBase, srcRoot),
      prompts: buildPromptEntries(selectedPrompts, srcRoot),
    });
  }
};

main().catch((err: unknown) => {
  console.error(err);

  process.exit(1);
});
