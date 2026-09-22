#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
// --- pure helpers ---
const AGENTS = ["copilot", "claude", "codex"];
const NON_CODE_SKILLS = new Set([
    "conventional-commits",
    "git-commits",
    "incremental-implementation",
    "incremental-planning",
    "shortcuts",
]);
const MANIFEST_FILE = ".agent-manifest.json";
const parseAgentsInput = (raw) => {
    const input = raw.trim().toLowerCase();
    if (!input) {
        return ["copilot"];
    }
    const matched = input
        .split(",")
        .map((s) => AGENTS.find((a) => a.startsWith(s.trim())))
        .filter((a) => a !== undefined);
    return matched.length > 0 ? matched : ["copilot"];
};
const instructionsSrc = (agent, srcGithub) => {
    if (agent === "claude") {
        return path_1.default.join(srcGithub, "agent-instructions", "claude.md");
    }
    if (agent === "codex") {
        return path_1.default.join(srcGithub, "agent-instructions", "codex.md");
    }
    return path_1.default.join(srcGithub, "copilot-instructions.md");
};
const instructionsDest = (agent, cwd) => {
    if (agent === "claude") {
        return path_1.default.join(cwd, "CLAUDE.md");
    }
    if (agent === "codex") {
        return path_1.default.join(cwd, "AGENTS.md");
    }
    return path_1.default.join(cwd, ".github", "copilot-instructions.md");
};
const skillsDir = (agent, cwd) => {
    if (agent === "claude") {
        return path_1.default.join(cwd, ".claude", "skills");
    }
    if (agent === "codex") {
        return path_1.default.join(cwd, ".agents", "skills");
    }
    return path_1.default.join(cwd, ".github", "skills");
};
const listSkills = (srcBase) => fs_1.default
    .readdirSync(srcBase, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
const listPromptFiles = (srcRoot) => fs_1.default
    .readdirSync(path_1.default.join(srcRoot, "prompts"), { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name);
const promptLabel = (file) => file.replace(/\.prompt\.md$/, "");
const parseSkillSelection = (raw, skills) => {
    const indices = raw
        .split(",")
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((i) => !isNaN(i) && i >= 0 && i < skills.length);
    return indices.map((i) => skills[i]);
};
// --- side effects ---
const createPrompter = () => {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const buffer = [];
    const waiters = [];
    rl.on("line", (line) => {
        if (waiters.length > 0) {
            waiters.shift()(line);
        }
        else {
            buffer.push(line);
        }
    });
    const ask = (question) => new Promise((resolve) => {
        process.stdout.write(question);
        if (buffer.length > 0) {
            resolve(buffer.shift());
        }
        else {
            waiters.push(resolve);
        }
    });
    return { ask, close: () => rl.close() };
};
const copyInstructions = (srcPath, destPath) => {
    fs_1.default.mkdirSync(path_1.default.dirname(destPath), { recursive: true });
    fs_1.default.copyFileSync(srcPath, destPath);
    console.log(`  wrote  ${path_1.default.relative(process.cwd(), destPath)}`);
};
const copySkill = (srcBase, destBase, skill) => {
    fs_1.default.cpSync(path_1.default.join(srcBase, skill), path_1.default.join(destBase, skill), {
        recursive: true,
    });
    console.log(`  wrote  ${path_1.default.relative(process.cwd(), path_1.default.join(destBase, skill))}/`);
};
const copyCopilotDirectory = (srcRoot, cwd, directory) => {
    const source = path_1.default.join(srcRoot, directory);
    const destination = path_1.default.join(cwd, ".github", directory);
    fs_1.default.cpSync(source, destination, { recursive: true });
    console.log(`  wrote  ${path_1.default.relative(process.cwd(), destination)}/`);
};
const copyPromptFile = (srcRoot, cwd, file) => {
    const destination = path_1.default.join(cwd, ".github", "prompts", file);
    fs_1.default.mkdirSync(path_1.default.dirname(destination), { recursive: true });
    fs_1.default.copyFileSync(path_1.default.join(srcRoot, "prompts", file), destination);
    console.log(`  wrote  ${path_1.default.relative(process.cwd(), destination)}`);
};
// --- interactive TTY agent selector ---
const ttySelectAgents = (preselected = []) => {
    const options = [
        { value: "copilot", label: "copilot (default)" },
        { value: "claude", label: "claude" },
        { value: "codex", label: "codex" },
    ];
    const selected = new Set(preselected);
    let cursor = Math.max(0, options.findIndex((opt) => preselected.includes(opt.value)));
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
    stdin.setRawMode(true);
    stdin.resume();
    renderList();
    return new Promise((resolve) => {
        const cleanup = (result) => {
            stdin.removeListener("data", onData);
            stdin.setRawMode(false);
            stdin.pause();
            stdout.write("\x1b[?25h");
            if (lineCount > 0) {
                stdout.write(`\x1b[${lineCount}A\x1b[0J`);
            }
            stdout.write(`  agents: ${result.join(", ")}\n`);
        };
        const onData = (chunk) => {
            const key = chunk.toString();
            if (key === "\x03") {
                cleanup([]);
                process.exit(130);
            }
            else if (key === "\x1b[A") {
                cursor = (cursor - 1 + options.length) % options.length;
                renderList();
            }
            else if (key === "\x1b[B") {
                cursor = (cursor + 1) % options.length;
                renderList();
            }
            else if (key === " ") {
                const val = options[cursor].value;
                if (selected.has(val)) {
                    selected.delete(val);
                }
                else {
                    selected.add(val);
                }
                renderList();
            }
            else if (key === "\r") {
                const result = selected.size > 0 ? [...selected] : [options[cursor].value];
                cleanup(result);
                resolve(result);
            }
        };
        stdin.on("data", onData);
    });
};
// --- prompts ---
const promptAgent = async (prompter) => {
    const raw = await prompter.ask("Agent(s) [copilot/claude/codex] (default: copilot, comma-separated for multiple): ");
    return parseAgentsInput(raw);
};
const promptSkills = async (prompter, skills) => {
    const nonCode = skills.filter((s) => NON_CODE_SKILLS.has(s));
    const code = skills.filter((s) => !NON_CODE_SKILLS.has(s));
    const nonCodeAnswer = await prompter.ask(`Install ${nonCode.length} non-code skills? [Y/n]: `);
    const codeAnswer = await prompter.ask(`Install ${code.length} code skills? [y/N]: `);
    return [
        ...(nonCodeAnswer.trim().toLowerCase() !== "n" ? nonCode : []),
        ...(codeAnswer.trim().toLowerCase() === "y" ? code : []),
    ];
};
const promptPrompts = async (prompter, prompts) => {
    const allAnswer = await prompter.ask(`Install all ${prompts.length} prompts? [Y/n]: `);
    if (allAnswer.trim().toLowerCase() !== "n") {
        return prompts;
    }
    console.log("\nAvailable prompts:");
    prompts.forEach((p, i) => console.log(`  ${i + 1}) ${promptLabel(p)}`));
    const selection = await prompter.ask("\nEnter numbers to install (e.g. 1,3): ");
    return parseSkillSelection(selection, prompts);
};
// --- interactive TTY skill selector ---
const ttySelectSkillsAndPrompts = (allSkills, allPrompts, existingSkills, existingPrompts) => {
    const nonCode = allSkills.filter((s) => NON_CODE_SKILLS.has(s));
    const react = allSkills.filter((s) => s.startsWith("react-"));
    const vue = allSkills.filter((s) => s.startsWith("vue-"));
    const angular = allSkills.filter((s) => s.startsWith("angular-"));
    const coreCode = allSkills.filter((s) => !NON_CODE_SKILLS.has(s) &&
        !react.includes(s) &&
        !vue.includes(s) &&
        !angular.includes(s));
    const sectionItems = (label, type, values) => values.length > 0
        ? [
            { kind: "header", label },
            { kind: "selectAll", type, values },
            ...values.map((value) => ({ kind: "option", type, value })),
        ]
        : [{ kind: "header", label }];
    const items = [
        ...sectionItems("Code conventions", "skill", nonCode),
        ...sectionItems("Core code", "skill", coreCode),
        ...sectionItems("React", "skill", react),
        ...sectionItems("Vue.js", "skill", vue),
        ...sectionItems("Angular", "skill", angular),
        ...sectionItems("Prompts", "prompt", allPrompts),
    ];
    const optionIndices = items.reduce((acc, item, i) => {
        if (item.kind !== "header") {
            acc.push(i);
        }
        return acc;
    }, []);
    const selectionKey = (type, value) => `${type}:${value}`;
    const selected = new Set(existingSkills !== undefined || existingPrompts !== undefined
        ? [
            ...(existingSkills ?? []).map((skill) => selectionKey("skill", skill)),
            ...(existingPrompts ?? []).map((prompt) => selectionKey("prompt", prompt)),
        ]
        : [
            ...nonCode.map((skill) => selectionKey("skill", skill)),
            ...allPrompts.map((prompt) => selectionKey("prompt", prompt)),
        ]);
    let cursorIdx = 0;
    let lineCount = 0;
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
            }
            else {
                const isCursor = i === cursorItemIdx;
                const isSelectAll = item.kind === "selectAll";
                const isSelected = isSelectAll
                    ? item.values.every((value) => selected.has(selectionKey(item.type, value)))
                    : selected.has(selectionKey(item.type, item.value));
                const label = isSelectAll
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
    stdin.setRawMode(true);
    stdin.resume();
    renderList();
    return new Promise((resolve) => {
        const cleanup = (result) => {
            stdin.removeListener("data", onData);
            stdin.setRawMode(false);
            stdin.pause();
            stdout.write("\x1b[?25h");
            if (lineCount > 0) {
                stdout.write(`\x1b[${lineCount}A\x1b[0J`);
            }
            const skillLabel = result.skills.length > 0 ? result.skills.join(", ") : "none";
            const promptLabelText = result.prompts.length > 0
                ? result.prompts.map(promptLabel).join(", ")
                : "none";
            stdout.write(`  skills: ${skillLabel}\n`);
            stdout.write(`  prompts: ${promptLabelText}\n`);
        };
        const onData = (chunk) => {
            const key = chunk.toString();
            if (key === "\x03") {
                cleanup({ skills: [], prompts: [] });
                process.exit(130);
            }
            else if (key === "\x1b[A") {
                cursorIdx =
                    (cursorIdx - 1 + optionIndices.length) % optionIndices.length;
                renderList();
            }
            else if (key === "\x1b[B") {
                cursorIdx = (cursorIdx + 1) % optionIndices.length;
                renderList();
            }
            else if (key === " ") {
                const item = items[optionIndices[cursorIdx]];
                if (item.kind === "selectAll") {
                    const isSelected = item.values.every((value) => selected.has(selectionKey(item.type, value)));
                    item.values.forEach((value) => {
                        const key = selectionKey(item.type, value);
                        if (isSelected) {
                            selected.delete(key);
                        }
                        else {
                            selected.add(key);
                        }
                    });
                    renderList();
                }
                else if (item.kind === "option") {
                    const key = selectionKey(item.type, item.value);
                    if (selected.has(key)) {
                        selected.delete(key);
                    }
                    else {
                        selected.add(key);
                    }
                    renderList();
                }
            }
            else if (key === "\r") {
                const result = items.reduce((selection, item) => {
                    if (item.kind === "option") {
                        const key = selectionKey(item.type, item.value);
                        if (selected.has(key)) {
                            selection[item.type === "skill" ? "skills" : "prompts"].push(item.value);
                        }
                    }
                    return selection;
                }, { skills: [], prompts: [] });
                cleanup(result);
                resolve(result);
            }
        };
        stdin.on("data", onData);
    });
};
// --- existing installation detection ---
const detectInstalledAgents = (cwd) => AGENTS.filter((agent) => fs_1.default.existsSync(instructionsDest(agent, cwd)));
const detectInstalledSkills = (agent, cwd) => {
    const dir = skillsDir(agent, cwd);
    if (!fs_1.default.existsSync(dir)) {
        return [];
    }
    return fs_1.default
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
};
const packageVersion = (srcRoot) => {
    const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(srcRoot, "package.json"), "utf8"));
    return pkg.version;
};
const readManifest = (cwd) => {
    const manifestPath = path_1.default.join(cwd, MANIFEST_FILE);
    if (!fs_1.default.existsSync(manifestPath)) {
        return null;
    }
    try {
        return JSON.parse(fs_1.default.readFileSync(manifestPath, "utf8"));
    }
    catch {
        return null;
    }
};
const writeManifest = (cwd, manifest) => {
    fs_1.default.writeFileSync(path_1.default.join(cwd, MANIFEST_FILE), JSON.stringify(manifest, null, 2) + "\n");
    console.log(`  wrote  ${MANIFEST_FILE}`);
};
const detectExistingSelection = (cwd, srcRoot) => {
    const manifest = readManifest(cwd);
    if (manifest) {
        return {
            agents: manifest.agents,
            skills: manifest.skills,
            prompts: manifest.prompts,
        };
    }
    const agents = detectInstalledAgents(cwd);
    const skills = [
        ...new Set(agents.flatMap((agent) => detectInstalledSkills(agent, cwd))),
    ];
    const prompts = agents.includes("copilot")
        ? listPromptFiles(srcRoot).filter((file) => fs_1.default.existsSync(path_1.default.join(cwd, ".github", "prompts", file)))
        : [];
    return { agents, skills, prompts };
};
// --- main ---
const runInstall = (agents, selectedSkills, selectedPrompts, srcRoot, srcGithub, srcSkillsBase, cwd) => {
    console.log("");
    agents.forEach((agent) => {
        copyInstructions(instructionsSrc(agent, srcGithub), instructionsDest(agent, cwd));
        const dest = skillsDir(agent, cwd);
        selectedSkills.forEach((skill) => copySkill(srcSkillsBase, dest, skill));
        if (agent === "copilot") {
            copyCopilotDirectory(srcRoot, cwd, "instructions");
            selectedPrompts.forEach((file) => copyPromptFile(srcRoot, cwd, file));
        }
    });
    copyInstructions(path_1.default.join(__dirname, "..", "AGENT.md"), path_1.default.join(cwd, "AGENT.md"));
    const promptItems = agents.includes("copilot") ? selectedPrompts.length : 0;
    const totalItems = agents.length * (1 + selectedSkills.length) + promptItems + 1;
    console.log(`\ndone - ${totalItems} item(s) installed for ${agents.join(", ")}`);
};
const main = async () => {
    const srcRoot = path_1.default.join(__dirname, "..");
    const srcGithub = path_1.default.join(srcRoot, ".github");
    const srcSkillsBase = path_1.default.join(srcRoot, "skills");
    const cwd = process.cwd();
    const existing = detectExistingSelection(cwd, srcRoot);
    const hasExisting = existing.agents.length > 0;
    if (process.stdin.isTTY) {
        const agents = await ttySelectAgents(existing.agents);
        const selection = await ttySelectSkillsAndPrompts(listSkills(srcSkillsBase), agents.includes("copilot") ? listPromptFiles(srcRoot) : [], hasExisting ? existing.skills : undefined, hasExisting ? existing.prompts : undefined);
        runInstall(agents, selection.skills, selection.prompts, srcRoot, srcGithub, srcSkillsBase, cwd);
        writeManifest(cwd, {
            version: packageVersion(srcRoot),
            agents,
            skills: selection.skills,
            prompts: selection.prompts,
        });
    }
    else {
        const prompter = createPrompter();
        const agents = await promptAgent(prompter);
        const selectedSkills = await promptSkills(prompter, listSkills(srcSkillsBase));
        const selectedPrompts = agents.includes("copilot")
            ? await promptPrompts(prompter, listPromptFiles(srcRoot))
            : [];
        prompter.close();
        runInstall(agents, selectedSkills, selectedPrompts, srcRoot, srcGithub, srcSkillsBase, cwd);
        writeManifest(cwd, {
            version: packageVersion(srcRoot),
            agents,
            skills: selectedSkills,
            prompts: selectedPrompts,
        });
    }
};
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
