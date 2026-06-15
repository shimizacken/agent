"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const run = (input, tmpDir) => (0, node_child_process_1.spawnSync)("node", [node_path_1.default.resolve(__dirname, "install.js")], {
    cwd: tmpDir,
    input,
    encoding: "utf8",
});
(0, node_test_1.describe)("install script", () => {
    let tmpDir;
    (0, node_test_1.before)(() => {
        tmpDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), "copilot-setup-"));
    });
    (0, node_test_1.after)(() => {
        node_fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.it)("exits with code 0 (default copilot)", () => {
        const result = run("\n\n", tmpDir);
        strict_1.default.equal(result.status, 0);
    });
    (0, node_test_1.it)("copies copilot-instructions.md for default agent", () => {
        const target = node_path_1.default.join(tmpDir, ".github", "copilot-instructions.md");
        strict_1.default.ok(node_fs_1.default.existsSync(target), `expected ${target} to exist`);
    });
    (0, node_test_1.it)("copies conventional-commits SKILL.md", () => {
        const target = node_path_1.default.join(tmpDir, ".github", "skills", "conventional-commits", "SKILL.md");
        strict_1.default.ok(node_fs_1.default.existsSync(target), `expected ${target} to exist`);
    });
    (0, node_test_1.it)("copies AGENT.md to project root", () => {
        const target = node_path_1.default.join(tmpDir, "AGENT.md");
        strict_1.default.ok(node_fs_1.default.existsSync(target), `expected ${target} to exist`);
    });
});
(0, node_test_1.describe)("install script - claude agent", () => {
    let tmpDir;
    (0, node_test_1.before)(() => {
        tmpDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), "copilot-setup-claude-"));
    });
    (0, node_test_1.after)(() => {
        node_fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.it)("exits with code 0", () => {
        const result = run("claude\n\n", tmpDir);
        strict_1.default.equal(result.status, 0);
    });
    (0, node_test_1.it)("copies CLAUDE.md to project root", () => {
        const target = node_path_1.default.join(tmpDir, "CLAUDE.md");
        strict_1.default.ok(node_fs_1.default.existsSync(target), `expected ${target} to exist`);
    });
    (0, node_test_1.it)("copies skills to .claude/skills/", () => {
        const target = node_path_1.default.join(tmpDir, ".claude", "skills", "conventional-commits", "SKILL.md");
        strict_1.default.ok(node_fs_1.default.existsSync(target), `expected ${target} to exist`);
    });
});
(0, node_test_1.describe)("install script - multiple agents", () => {
    let tmpDir;
    (0, node_test_1.before)(() => {
        tmpDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), "copilot-setup-multi-"));
    });
    (0, node_test_1.after)(() => {
        node_fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.it)("exits with code 0", () => {
        const result = run("copilot,claude\n\n", tmpDir);
        strict_1.default.equal(result.status, 0);
    });
    (0, node_test_1.it)("copies copilot-instructions.md", () => {
        strict_1.default.ok(node_fs_1.default.existsSync(node_path_1.default.join(tmpDir, ".github", "copilot-instructions.md")));
    });
    (0, node_test_1.it)("copies CLAUDE.md", () => {
        strict_1.default.ok(node_fs_1.default.existsSync(node_path_1.default.join(tmpDir, "CLAUDE.md")));
    });
    (0, node_test_1.it)("copies skills to .github/skills/", () => {
        strict_1.default.ok(node_fs_1.default.existsSync(node_path_1.default.join(tmpDir, ".github", "skills", "conventional-commits", "SKILL.md")));
    });
    (0, node_test_1.it)("copies skills to .claude/skills/", () => {
        strict_1.default.ok(node_fs_1.default.existsSync(node_path_1.default.join(tmpDir, ".claude", "skills", "conventional-commits", "SKILL.md")));
    });
});
(0, node_test_1.describe)("install script - codex agent", () => {
    let tmpDir;
    (0, node_test_1.before)(() => {
        tmpDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), "copilot-setup-codex-"));
    });
    (0, node_test_1.after)(() => {
        node_fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.it)("exits with code 0", () => {
        const result = run("codex\n\n", tmpDir);
        strict_1.default.equal(result.status, 0);
    });
    (0, node_test_1.it)("copies AGENTS.md to project root", () => {
        const target = node_path_1.default.join(tmpDir, "AGENTS.md");
        strict_1.default.ok(node_fs_1.default.existsSync(target), `expected ${target} to exist`);
    });
    (0, node_test_1.it)("copies skills to .agents/skills/", () => {
        const target = node_path_1.default.join(tmpDir, ".agents", "skills", "conventional-commits", "SKILL.md");
        strict_1.default.ok(node_fs_1.default.existsSync(target), `expected ${target} to exist`);
    });
});
