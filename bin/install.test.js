const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

describe("install script", () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(
      path.join(require("node:os").tmpdir(), "copilot-setup-"),
    );
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("exits with code 0", () => {
    const result = spawnSync("node", [path.resolve(__dirname, "install.js")], {
      cwd: tmpDir,
    });

    assert.equal(result.status, 0);
  });

  it("copies copilot-instructions.md", () => {
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
