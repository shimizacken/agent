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
    const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
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
    fs_1.default.cpSync(path_1.default.join(srcBase, skill), path_1.default.join(destBase, skill), { recursive: true });
    console.log(`  wrote  ${path_1.default.relative(process.cwd(), path_1.default.join(destBase, skill))}/`);
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
    const prompter = createPrompter();
    const srcGithub = path_1.default.join(__dirname, "..", ".github");
    const srcSkillsBase = path_1.default.join(srcGithub, "skills");
    const cwd = process.cwd();
    const agents = await promptAgent(prompter);
    const allSkills = listSkills(srcSkillsBase);
    const selectedSkills = await promptSkills(prompter, allSkills);
    prompter.close();
    console.log("");
    agents.forEach((agent) => {
        copyInstructions(instructionsSrc(agent, srcGithub), instructionsDest(agent, cwd));
        const dest = skillsDir(agent, cwd);
        selectedSkills.forEach((skill) => copySkill(srcSkillsBase, dest, skill));
    });
    copyInstructions(path_1.default.join(__dirname, "..", "AGENT.md"), path_1.default.join(cwd, "AGENT.md"));
    const totalItems = agents.length * (1 + selectedSkills.length) + 1;
    console.log(`\ndone - ${totalItems} item(s) installed for ${agents.join(", ")}`);
};
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
