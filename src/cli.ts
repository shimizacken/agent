import fs from "fs";
import path from "path";
import readline from "readline";

import { AGENTS } from "./types/cli.type";
import type {
  Agent,
  Manifest,
  ManifestEntry,
  Prompter,
  ExistingSelection,
} from "./types/cli.type";
import {
  parseAgentsInput,
  getInstructionsSrcPath,
  getInstructionsDestPath,
  getSkillsDirPath,
} from "./utils/agent.utils";
import { NON_CODE_SKILLS, categorizeSkills } from "./utils/skillCategory.utils";
import { getPromptLabel, parsePromptSelection } from "./utils/prompt.utils";
import {
  MANIFEST_FILE,
  computeHashFromBuffer,
  buildManifestEntry,
} from "./utils/manifest.utils";
import { getSelectionKey, getRemovedItems } from "./utils/selection.utils";

// --- side effects ---

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

  prompts.forEach((p, i) => console.log(`  ${i + 1}) ${getPromptLabel(p)}`));

  const selection = await prompter.ask(
    "\nEnter numbers to install (e.g. 1,3): ",
  );

  return parsePromptSelection(selection, prompts);
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

  const { nonCode, coreCode, react, vue, angular } =
    categorizeSkills(allSkills);

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

  const selected = new Set<string>(
    existingSkills !== undefined || existingPrompts !== undefined
      ? [
          ...(existingSkills ?? []).map((skill) =>
            getSelectionKey("skill", skill),
          ),
          ...(existingPrompts ?? []).map((prompt) =>
            getSelectionKey("prompt", prompt),
          ),
        ]
      : [
          ...nonCode.map((skill) => getSelectionKey("skill", skill)),
          ...allPrompts.map((prompt) => getSelectionKey("prompt", prompt)),
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
                selected.has(getSelectionKey(item.type, value)),
              )
            : selected.has(getSelectionKey(item.type, item.value));
        const label = isUpdateAll
          ? "Update all selected skills to latest version"
          : isSelectAll
            ? "Select all"
            : item.type === "prompt"
              ? getPromptLabel(item.value)
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
          ? result.prompts.map(getPromptLabel).join(", ")
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
            ...item.skills.map((skill) => getSelectionKey("skill", skill)),
            ...item.prompts.map((prompt) => getSelectionKey("prompt", prompt)),
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
            selected.has(getSelectionKey(item.type, value)),
          );

          item.values.forEach((value) => {
            const key = getSelectionKey(item.type, value);

            if (isSelected) {
              selected.delete(key);
            } else {
              selected.add(key);
            }
          });

          renderList();
        } else if (item.kind === "option") {
          const key = getSelectionKey(item.type, item.value);

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
              const key = getSelectionKey(item.type, item.value);

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
  AGENTS.filter((agent) => fs.existsSync(getInstructionsDestPath(agent, cwd)));

const detectInstalledSkills = (agent: Agent, cwd: string): string[] => {
  const dir = getSkillsDirPath(agent, cwd);

  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
};

const computeFileHash = (filePath: string): string =>
  computeHashFromBuffer(fs.readFileSync(filePath));

const buildSkillEntries = (
  skills: string[],
  srcSkillsBase: string,
  srcRoot: string,
): Record<string, ManifestEntry> =>
  Object.fromEntries(
    skills.map((skill) => {
      const filePath = path.join(srcSkillsBase, skill, "SKILL.md");

      return [
        skill,
        buildManifestEntry({
          srcRoot,
          filePath,
          computedHash: computeFileHash(filePath),
        }),
      ];
    }),
  );

const buildPromptEntries = (
  prompts: string[],
  srcRoot: string,
): Record<string, ManifestEntry> =>
  Object.fromEntries(
    prompts.map((file) => {
      const filePath = path.join(srcRoot, "prompts", file);

      return [
        file,
        buildManifestEntry({
          srcRoot,
          filePath,
          computedHash: computeFileHash(filePath),
        }),
      ];
    }),
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
    const target = path.join(getSkillsDirPath(agent, cwd), skill);

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
  const instructions = getInstructionsDestPath(agent, cwd);

  if (fs.existsSync(instructions)) {
    fs.rmSync(instructions);
    console.log(`  removed  ${path.relative(cwd, instructions)}`);
  }

  const dir = getSkillsDirPath(agent, cwd);

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
  const removedAgents = getRemovedItems(existing.agents, finalAgents);
  const removedSkills = getRemovedItems(existing.skills, finalSkills);
  const removedPrompts = getRemovedItems(existing.prompts, finalPrompts);

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
    ...removedPrompts.map((file) => getPromptLabel(file)),
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
      getInstructionsSrcPath(agent, srcGithub),
      getInstructionsDestPath(agent, cwd),
    );

    const dest = getSkillsDirPath(agent, cwd);

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

export const main = async (): Promise<void> => {
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
