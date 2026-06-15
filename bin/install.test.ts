import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const run = (input: string, tmpDir: string) =>
  spawnSync("node", [path.resolve(__dirname, "install.js")], {
    cwd: tmpDir,
    input,
    encoding: "utf8",
  });

describe("install script", () => {
  let tmpDir: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "copilot-setup-"));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("exits with code 0 (default copilot)", () => {
    const result = run("\n\n", tmpDir);

    assert.equal(result.status, 0);
  });

  it("copies copilot-instructions.md for default agent", () => {
    const target = path.join(tmpDir, ".github", "copilot-instructions.md");

    assert.ok(fs.existsSync(target), `expected ${target} to exist`);
  });

  it("copies conventional-commits SKILL.md", () => {
    const target = path.join(
      tmpDir,
      ".github",
      "skills",
      "conventional-commits",
      "SKILL.md",
    );

    assert.ok(fs.existsSync(target), `expected ${target} to exist`);
  });

  it("copies AGENT.md to project root", () => {
    const target = path.join(tmpDir, "AGENT.md");

    assert.ok(fs.existsSync(target), `expected ${target} to exist`);
  });
});

describe("install script - claude agent", () => {
  let tmpDir: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "copilot-setup-claude-"));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("exits with code 0", () => {
    const result = run("claude\n\n", tmpDir);

    assert.equal(result.status, 0);
  });

  it("copies CLAUDE.md to project root", () => {
    const target = path.join(tmpDir, "CLAUDE.md");

    assert.ok(fs.existsSync(target), `expected ${target} to exist`);
  });

  it("copies skills to .claude/skills/", () => {
    const target = path.join(
      tmpDir,
      ".claude",
      "skills",
      "conventional-commits",
      "SKILL.md",
    );

    assert.ok(fs.existsSync(target), `expected ${target} to exist`);
  });
});

describe("install script - multiple agents", () => {
  let tmpDir: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "copilot-setup-multi-"));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("exits with code 0", () => {
    const result = run("copilot,claude\n\n", tmpDir);

    assert.equal(result.status, 0);
  });

  it("copies copilot-instructions.md", () => {
    assert.ok(
      fs.existsSync(path.join(tmpDir, ".github", "copilot-instructions.md")),
    );
  });

  it("copies CLAUDE.md", () => {
    assert.ok(fs.existsSync(path.join(tmpDir, "CLAUDE.md")));
  });

  it("copies skills to .github/skills/", () => {
    assert.ok(
      fs.existsSync(
        path.join(
          tmpDir,
          ".github",
          "skills",
          "conventional-commits",
          "SKILL.md",
        ),
      ),
    );
  });

  it("copies skills to .claude/skills/", () => {
    assert.ok(
      fs.existsSync(
        path.join(
          tmpDir,
          ".claude",
          "skills",
          "conventional-commits",
          "SKILL.md",
        ),
      ),
    );
  });
});

describe("install script - codex agent", () => {
  let tmpDir: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "copilot-setup-codex-"));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("exits with code 0", () => {
    const result = run("codex\n\n", tmpDir);

    assert.equal(result.status, 0);
  });

  it("copies AGENTS.md to project root", () => {
    const target = path.join(tmpDir, "AGENTS.md");

    assert.ok(fs.existsSync(target), `expected ${target} to exist`);
  });

  it("copies skills to .agents/skills/", () => {
    const target = path.join(
      tmpDir,
      ".agents",
      "skills",
      "conventional-commits",
      "SKILL.md",
    );

    assert.ok(fs.existsSync(target), `expected ${target} to exist`);
  });
});
