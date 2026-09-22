"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const manifest_utils_1 = require("./manifest.utils");
(0, vitest_1.describe)("computeHashFromBuffer", () => {
    (0, vitest_1.it)("returns a stable sha256 hex digest for the same content", () => {
        const hash = (0, manifest_utils_1.computeHashFromBuffer)(Buffer.from("hello"));
        (0, vitest_1.expect)(hash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    });
    (0, vitest_1.it)("returns different hashes for different content", () => {
        const a = (0, manifest_utils_1.computeHashFromBuffer)(Buffer.from("hello"));
        const b = (0, manifest_utils_1.computeHashFromBuffer)(Buffer.from("world"));
        (0, vitest_1.expect)(a).not.toBe(b);
    });
});
(0, vitest_1.describe)("buildManifestEntry", () => {
    (0, vitest_1.it)("builds an entry with a source-relative skillPath", () => {
        const entry = (0, manifest_utils_1.buildManifestEntry)({
            srcRoot: "/repo",
            filePath: "/repo/skills/shortcuts/SKILL.md",
            computedHash: "abc123",
        });
        (0, vitest_1.expect)(entry).toEqual({
            source: "shimizacken/agent",
            sourceType: "github",
            skillPath: "skills/shortcuts/SKILL.md",
            computedHash: "abc123",
        });
    });
});
