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
    const allAnswer = await prompter.ask(`Install all ${skills.length} skills? [Y/n]: `);
    if (allAnswer.trim().toLowerCase() !== "n") {
        return skills;
    }
    console.log("\nAvailable skills:");
    skills.forEach((s, i) => console.log(`  ${i + 1}) ${s}`));
    const selection = await prompter.ask("\nEnter numbers to install (e.g. 1,3): ");
    return parseSkillSelection(selection, skills);
};
// --- main ---
const main = async () => {
    const srcGithub = path_1.default.join(__dirname, "..", ".github");
    const srcSkillsBase = path_1.default.join(srcGithub, "skills");
    const cwd = process.cwd();
    const allSkills = listSkills(srcSkillsBase);
    let agents;
    let selectedSkills;
    if (process.stdin.isTTY) {
        agents = await ttySelectAgents();
        const prompter = createPrompter();
        selectedSkills = await promptSkills(prompter, allSkills);
        prompter.close();
    }
    else {
        const prompter = createPrompter();
        agents = await promptAgent(prompter);
        selectedSkills = await promptSkills(prompter, allSkills);
        prompter.close();
    }
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
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
