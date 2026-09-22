import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildManifestEntry, computeHashFromBuffer } from "./manifest.utils";

describe("computeHashFromBuffer", () => {
  it("returns a stable sha256 hex digest for the same content", () => {
    const hash = computeHashFromBuffer(Buffer.from("hello"));

    assert.equal(
      hash,
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("returns different hashes for different content", () => {
    const a = computeHashFromBuffer(Buffer.from("hello"));
    const b = computeHashFromBuffer(Buffer.from("world"));

    assert.notEqual(a, b);
  });
});

describe("buildManifestEntry", () => {
  it("builds an entry with a source-relative skillPath", () => {
    const entry = buildManifestEntry({
      srcRoot: "/repo",
      filePath: "/repo/skills/shortcuts/SKILL.md",
      computedHash: "abc123",
    });

    assert.deepEqual(entry, {
      source: "shimizacken/agent",
      sourceType: "github",
      skillPath: "skills/shortcuts/SKILL.md",
      computedHash: "abc123",
    });
  });
});
