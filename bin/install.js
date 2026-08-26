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
    "code-change",
    "conventional-commits",
    "git-commits",
    "incremental-implementation",
    "incremental-planning",
    "shortcuts",
]);
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
const copyCopilotDirectory = (srcGithub, cwd, directory) => {
    const source = path_1.default.join(srcGithub, directory);
    const destination = path_1.default.join(cwd, ".github", directory);
    fs_1.default.cpSync(source, destination, { recursive: true });
    console.log(`  wrote  ${path_1.default.relative(process.cwd(), destination)}/`);
};
// --- interactive TTY agent selector ---
const ttySelectAgents = () => {
    const options = [
        { value: "copilot", label: "copilot (default)" },
        { value: "claude", label: "claude" },
        { value: "codex", label: "codex" },
    ];
    const selected = new Set();
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
// --- interactive TTY skill selector ---
const ttySelectSkills = (allSkills) => {
    const nonCode = allSkills.filter((s) => NON_CODE_SKILLS.has(s));
    const code = allSkills.filter((s) => !NON_CODE_SKILLS.has(s));
    const items = [
        { kind: "header", label: "Non-code" },
        ...nonCode.map((s) => ({ kind: "option", value: s })),
        { kind: "header", label: "Code" },
        ...code.map((s) => ({ kind: "option", value: s })),
    ];
    const optionIndices = items.reduce((acc, item, i) => {
        if (item.kind === "option") {
            acc.push(i);
        }
        return acc;
    }, []);
    const selected = new Set(nonCode);
    let cursorIdx = 0;
    let lineCount = 0;
    const { stdin, stdout } = process;
    const renderList = () => {
        if (lineCount > 0) {
            stdout.write(`\x1b[${lineCount}A\x1b[0J`);
        }
        const lines = [
            "  Select skills  \x1b[2m(\u2191\u2193 navigate \u00b7 space toggle \u00b7 enter confirm)\x1b[0m",
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
            const label = result.length > 0 ? result.join(", ") : "none";
            stdout.write(`  skills: ${label}\n`);
        };
        const onData = (chunk) => {
            const key = chunk.toString();
            if (key === "\x03") {
                cleanup([]);
                process.exit(130);
            }
            else if (key === "\x1b[A") {
                cursorIdx = (cursorIdx - 1 + optionIndices.length) % optionIndices.length;
                renderList();
            }
            else if (key === "\x1b[B") {
                cursorIdx = (cursorIdx + 1) % optionIndices.length;
                renderList();
            }
            else if (key === " ") {
                const item = items[optionIndices[cursorIdx]];
                if (item.kind === "option") {
                    if (selected.has(item.value)) {
                        selected.delete(item.value);
                    }
                    else {
                        selected.add(item.value);
                    }
                    renderList();
                }
            }
            else if (key === "\r") {
                const result = [...selected];
                cleanup(result);
                resolve(result);
            }
        };
        stdin.on("data", onData);
    });
};
// --- update helpers ---
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
// --- TTY mode selector ---
const ttySelectMode = () => {
    const options = [
        { value: "install", label: "Fresh install" },
        { value: "update", label: "Update existing" },
    ];
    let cursor = 0;
    let lineCount = 0;
    const { stdin, stdout } = process;
    const renderList = () => {
        if (lineCount > 0) {
            stdout.write(`\x1b[${lineCount}A\x1b[0J`);
        }
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
            stdout.write(`  mode: ${result}\n`);
        };
        const onData = (chunk) => {
            const key = chunk.toString();
            if (key === "\x03") {
                cleanup("install");
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
            else if (key === "\r") {
                const result = options[cursor].value;
                cleanup(result);
                resolve(result);
            }
        };
        stdin.on("data", onData);
    });
};
// --- main ---
const runInstall = (agents, selectedSkills, srcGithub, srcSkillsBase, cwd) => {
    console.log("");
    agents.forEach((agent) => {
        copyInstructions(instructionsSrc(agent, srcGithub), instructionsDest(agent, cwd));
        const dest = skillsDir(agent, cwd);
        selectedSkills.forEach((skill) => copySkill(srcSkillsBase, dest, skill));
        if (agent === "copilot") {
            copyCopilotDirectory(srcGithub, cwd, "instructions");
            copyCopilotDirectory(srcGithub, cwd, "prompts");
        }
    });
    copyInstructions(path_1.default.join(__dirname, "..", "AGENT.md"), path_1.default.join(cwd, "AGENT.md"));
    const totalItems = agents.length * (1 + selectedSkills.length) + 1;
    console.log(`\ndone - ${totalItems} item(s) installed for ${agents.join(", ")}`);
};
const runUpdate = (srcGithub, srcSkillsBase, cwd) => {
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
    copyInstructions(path_1.default.join(__dirname, "..", "AGENT.md"), path_1.default.join(cwd, "AGENT.md"));
    console.log(`\ndone - updated ${agents.join(", ")}`);
};
const main = async () => {
    const srcGithub = path_1.default.join(__dirname, "..", ".github");
    const srcSkillsBase = path_1.default.join(__dirname, "..", ".agent", "skills");
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
    }
    else {
        const prompter = createPrompter();
        const agents = await promptAgent(prompter);
        const selectedSkills = await promptSkills(prompter, listSkills(srcSkillsBase));
        prompter.close();
        runInstall(agents, selectedSkills, srcGithub, srcSkillsBase, cwd);
    }
};
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
