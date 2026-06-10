const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const run = (input, tmpDir) =>
  spawnSync("node", [path.resolve(__dirname, "install.js")], {
    cwd: tmpDir,
    input,
    encoding: "utf8",
  });

describe("install script", () => {
  let tmpDir;

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
});

describe("install script - claude agent", () => {
  let tmpDir;

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
});

describe("install script - codex agent", () => {
  let tmpDir;

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
});
