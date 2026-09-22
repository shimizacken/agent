"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const cli_types_1 = require("./cli.types");
const agent_utils_1 = require("./utils/agent.utils");
const skill_category_utils_1 = require("./utils/skill-category.utils");
const prompt_utils_1 = require("./utils/prompt.utils");
const manifest_utils_1 = require("./utils/manifest.utils");
const selection_utils_1 = require("./utils/selection.utils");
// --- side effects ---
const listSkills = (srcBase) => fs_1.default
    .readdirSync(srcBase, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
const listPromptFiles = (srcRoot) => fs_1.default
    .readdirSync(path_1.default.join(srcRoot, "prompts"), { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name);
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
    return (0, agent_utils_1.parseAgentsInput)(raw);
};
const promptSkills = async (prompter, skills) => {
    const nonCode = skills.filter((s) => skill_category_utils_1.NON_CODE_SKILLS.has(s));
    const code = skills.filter((s) => !skill_category_utils_1.NON_CODE_SKILLS.has(s));
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
    prompts.forEach((p, i) => console.log(`  ${i + 1}) ${(0, prompt_utils_1.getPromptLabel)(p)}`));
    const selection = await prompter.ask("\nEnter numbers to install (e.g. 1,3): ");
    return (0, prompt_utils_1.parsePromptSelection)(selection, prompts);
};
// --- interactive TTY skill selector ---
const ttySelectSkillsAndPrompts = (allSkills, allPrompts, existingSkills, existingPrompts) => {
    const { nonCode, coreCode, react, vue, angular } = (0, skill_category_utils_1.categorizeSkills)(allSkills);
    const sectionItems = (label, type, values) => values.length > 0
        ? [
            { kind: "header", label },
            { kind: "selectAll", type, values },
            ...values.map((value) => ({ kind: "option", type, value })),
        ]
        : [{ kind: "header", label }];
    const isUpdateMode = existingSkills !== undefined || existingPrompts !== undefined;
    const items = [
        ...(isUpdateMode
            ? [
                {
                    kind: "updateAll",
                    skills: existingSkills ?? [],
                    prompts: existingPrompts ?? [],
                },
            ]
            : []),
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
    const selected = new Set(existingSkills !== undefined || existingPrompts !== undefined
        ? [
            ...(existingSkills ?? []).map((skill) => (0, selection_utils_1.getSelectionKey)("skill", skill)),
            ...(existingPrompts ?? []).map((prompt) => (0, selection_utils_1.getSelectionKey)("prompt", prompt)),
        ]
        : [
            ...nonCode.map((skill) => (0, selection_utils_1.getSelectionKey)("skill", skill)),
            ...allPrompts.map((prompt) => (0, selection_utils_1.getSelectionKey)("prompt", prompt)),
        ]);
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
            }
            else {
                const isCursor = i === cursorItemIdx;
                const isSelectAll = item.kind === "selectAll";
                const isUpdateAll = item.kind === "updateAll";
                const isSelected = isUpdateAll
                    ? updateAllChecked
                    : isSelectAll
                        ? item.values.every((value) => selected.has((0, selection_utils_1.getSelectionKey)(item.type, value)))
                        : selected.has((0, selection_utils_1.getSelectionKey)(item.type, item.value));
                const label = isUpdateAll
                    ? "Update all selected skills to latest version"
                    : isSelectAll
                        ? "Select all"
                        : item.type === "prompt"
                            ? (0, prompt_utils_1.getPromptLabel)(item.value)
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
                ? result.prompts.map(prompt_utils_1.getPromptLabel).join(", ")
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
                if (item.kind === "updateAll") {
                    const keys = [
                        ...item.skills.map((skill) => (0, selection_utils_1.getSelectionKey)("skill", skill)),
                        ...item.prompts.map((prompt) => (0, selection_utils_1.getSelectionKey)("prompt", prompt)),
                    ];
                    updateAllChecked = !updateAllChecked;
                    keys.forEach((key) => {
                        if (updateAllChecked) {
                            selected.add(key);
                        }
                        else {
                            selected.delete(key);
                        }
                    });
                    renderList();
                }
                else if (item.kind === "selectAll") {
                    const isSelected = item.values.every((value) => selected.has((0, selection_utils_1.getSelectionKey)(item.type, value)));
                    item.values.forEach((value) => {
                        const key = (0, selection_utils_1.getSelectionKey)(item.type, value);
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
                    const key = (0, selection_utils_1.getSelectionKey)(item.type, item.value);
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
                        const key = (0, selection_utils_1.getSelectionKey)(item.type, item.value);
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
const detectInstalledAgents = (cwd) => cli_types_1.AGENTS.filter((agent) => fs_1.default.existsSync((0, agent_utils_1.getInstructionsDestPath)(agent, cwd)));
const detectInstalledSkills = (agent, cwd) => {
    const dir = (0, agent_utils_1.getSkillsDirPath)(agent, cwd);
    if (!fs_1.default.existsSync(dir)) {
        return [];
    }
    return fs_1.default
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
};
const computeFileHash = (filePath) => (0, manifest_utils_1.computeHashFromBuffer)(fs_1.default.readFileSync(filePath));
const buildSkillEntries = (skills, srcSkillsBase, srcRoot) => Object.fromEntries(skills.map((skill) => {
    const filePath = path_1.default.join(srcSkillsBase, skill, "SKILL.md");
    return [
        skill,
        (0, manifest_utils_1.buildManifestEntry)({
            srcRoot,
            filePath,
            computedHash: computeFileHash(filePath),
        }),
    ];
}));
const buildPromptEntries = (prompts, srcRoot) => Object.fromEntries(prompts.map((file) => {
    const filePath = path_1.default.join(srcRoot, "prompts", file);
    return [
        file,
        (0, manifest_utils_1.buildManifestEntry)({
            srcRoot,
            filePath,
            computedHash: computeFileHash(filePath),
        }),
    ];
}));
const readManifest = (cwd) => {
    const manifestPath = path_1.default.join(cwd, manifest_utils_1.MANIFEST_FILE);
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
    fs_1.default.writeFileSync(path_1.default.join(cwd, manifest_utils_1.MANIFEST_FILE), JSON.stringify(manifest, null, 2) + "\n");
    console.log(`  wrote  ${manifest_utils_1.MANIFEST_FILE}`);
};
const detectExistingSelection = (cwd, srcRoot) => {
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
        ? listPromptFiles(srcRoot).filter((file) => fs_1.default.existsSync(path_1.default.join(cwd, ".github", "prompts", file)))
        : [];
    return { agents, skills, prompts };
};
// --- removal confirmation ---
const askQuestion = (question) => {
    const rl = readline_1.default.createInterface({
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
const removeSkillFromAgents = (agents, skill, cwd) => {
    agents.forEach((agent) => {
        const target = path_1.default.join((0, agent_utils_1.getSkillsDirPath)(agent, cwd), skill);
        if (fs_1.default.existsSync(target)) {
            fs_1.default.rmSync(target, { recursive: true, force: true });
            console.log(`  removed  ${path_1.default.relative(cwd, target)}/`);
        }
    });
};
const removePromptFile = (cwd, file) => {
    const target = path_1.default.join(cwd, ".github", "prompts", file);
    if (fs_1.default.existsSync(target)) {
        fs_1.default.rmSync(target);
        console.log(`  removed  ${path_1.default.relative(cwd, target)}`);
    }
};
const removeAgentInstallation = (agent, cwd) => {
    const instructions = (0, agent_utils_1.getInstructionsDestPath)(agent, cwd);
    if (fs_1.default.existsSync(instructions)) {
        fs_1.default.rmSync(instructions);
        console.log(`  removed  ${path_1.default.relative(cwd, instructions)}`);
    }
    const dir = (0, agent_utils_1.getSkillsDirPath)(agent, cwd);
    if (fs_1.default.existsSync(dir)) {
        fs_1.default.rmSync(dir, { recursive: true, force: true });
        console.log(`  removed  ${path_1.default.relative(cwd, dir)}/`);
    }
};
const confirmAndRemove = async (ask, cwd, existing, finalAgents, finalSkills, finalPrompts) => {
    const removedAgents = (0, selection_utils_1.getRemovedItems)(existing.agents, finalAgents);
    const removedSkills = (0, selection_utils_1.getRemovedItems)(existing.skills, finalSkills);
    const removedPrompts = (0, selection_utils_1.getRemovedItems)(existing.prompts, finalPrompts);
    if (removedAgents.length === 0 &&
        removedSkills.length === 0 &&
        removedPrompts.length === 0) {
        return;
    }
    const removedLabels = [
        ...removedAgents.map((agent) => `${agent} (agent)`),
        ...removedSkills,
        ...removedPrompts.map((file) => (0, prompt_utils_1.getPromptLabel)(file)),
    ];
    const answer = await ask(`\nAre you sure you want to remove the following:\n${removedLabels
        .map((label) => `  - ${label}`)
        .join("\n")}\n[y/N]: `);
    if (answer.trim().toLowerCase() !== "y") {
        console.log("  skipped removal - existing files kept");
        return;
    }
    console.log("");
    removedAgents.forEach((agent) => removeAgentInstallation(agent, cwd));
    removedSkills.forEach((skill) => removeSkillFromAgents(finalAgents, skill, cwd));
    removedPrompts.forEach((file) => removePromptFile(cwd, file));
};
// --- main ---
const runInstall = (agents, selectedSkills, selectedPrompts, srcRoot, srcGithub, srcSkillsBase, cwd) => {
    console.log("");
    agents.forEach((agent) => {
        copyInstructions((0, agent_utils_1.getInstructionsSrcPath)(agent, srcGithub), (0, agent_utils_1.getInstructionsDestPath)(agent, cwd));
        const dest = (0, agent_utils_1.getSkillsDirPath)(agent, cwd);
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
        const agents = hasExisting
            ? existing.agents
            : await ttySelectAgents(existing.agents);
        const selection = await ttySelectSkillsAndPrompts(listSkills(srcSkillsBase), agents.includes("copilot") ? listPromptFiles(srcRoot) : [], hasExisting ? existing.skills : undefined, hasExisting ? existing.prompts : undefined);
        await confirmAndRemove(askQuestion, cwd, existing, agents, selection.skills, selection.prompts);
        runInstall(agents, selection.skills, selection.prompts, srcRoot, srcGithub, srcSkillsBase, cwd);
        writeManifest(cwd, {
            version: 1,
            agents,
            skills: buildSkillEntries(selection.skills, srcSkillsBase, srcRoot),
            prompts: buildPromptEntries(selection.prompts, srcRoot),
        });
    }
    else {
        const prompter = createPrompter();
        const agents = await promptAgent(prompter);
        const selectedSkills = await promptSkills(prompter, listSkills(srcSkillsBase));
        const selectedPrompts = agents.includes("copilot")
            ? await promptPrompts(prompter, listPromptFiles(srcRoot))
            : [];
        await confirmAndRemove(prompter.ask, cwd, existing, agents, selectedSkills, selectedPrompts);
        prompter.close();
        runInstall(agents, selectedSkills, selectedPrompts, srcRoot, srcGithub, srcSkillsBase, cwd);
        writeManifest(cwd, {
            version: 1,
            agents,
            skills: buildSkillEntries(selectedSkills, srcSkillsBase, srcRoot),
            prompts: buildPromptEntries(selectedPrompts, srcRoot),
        });
    }
};
exports.main = main;
