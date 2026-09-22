"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSkillsDirPath = exports.getInstructionsDestPath = exports.getInstructionsSrcPath = exports.parseAgentsInput = void 0;
const path_1 = __importDefault(require("path"));
const cli_type_1 = require("../types/cli.type");
const parseAgentsInput = (raw) => {
    const input = raw.trim().toLowerCase();
    if (!input) {
        return ["copilot"];
    }
    const matched = input
        .split(",")
        .map((s) => cli_type_1.AGENTS.find((a) => a.startsWith(s.trim())))
        .filter((a) => a !== undefined);
    return matched.length > 0 ? matched : ["copilot"];
};
exports.parseAgentsInput = parseAgentsInput;
const getInstructionsSrcPath = (agent, srcGithub) => {
    if (agent === "claude") {
        return path_1.default.join(srcGithub, "agent-instructions", "claude.md");
    }
    if (agent === "codex") {
        return path_1.default.join(srcGithub, "agent-instructions", "codex.md");
    }
    return path_1.default.join(srcGithub, "copilot-instructions.md");
};
exports.getInstructionsSrcPath = getInstructionsSrcPath;
const getInstructionsDestPath = (agent, cwd) => {
    if (agent === "claude") {
        return path_1.default.join(cwd, "CLAUDE.md");
    }
    if (agent === "codex") {
        return path_1.default.join(cwd, "AGENTS.md");
    }
    return path_1.default.join(cwd, ".github", "copilot-instructions.md");
};
exports.getInstructionsDestPath = getInstructionsDestPath;
const getSkillsDirPath = (agent, cwd) => {
    if (agent === "claude") {
        return path_1.default.join(cwd, ".claude", "skills");
    }
    if (agent === "codex") {
        return path_1.default.join(cwd, ".agents", "skills");
    }
    return path_1.default.join(cwd, ".github", "skills");
};
exports.getSkillsDirPath = getSkillsDirPath;
