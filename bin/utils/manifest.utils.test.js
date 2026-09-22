"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const manifest_utils_1 = require("./manifest.utils");
(0, node_test_1.describe)("computeHashFromBuffer", () => {
    (0, node_test_1.it)("returns a stable sha256 hex digest for the same content", () => {
        const hash = (0, manifest_utils_1.computeHashFromBuffer)(Buffer.from("hello"));
        strict_1.default.equal(hash, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    });
    (0, node_test_1.it)("returns different hashes for different content", () => {
        const a = (0, manifest_utils_1.computeHashFromBuffer)(Buffer.from("hello"));
        const b = (0, manifest_utils_1.computeHashFromBuffer)(Buffer.from("world"));
        strict_1.default.notEqual(a, b);
    });
});
(0, node_test_1.describe)("buildManifestEntry", () => {
    (0, node_test_1.it)("builds an entry with a source-relative skillPath", () => {
        const entry = (0, manifest_utils_1.buildManifestEntry)({
            srcRoot: "/repo",
            filePath: "/repo/skills/shortcuts/SKILL.md",
            computedHash: "abc123",
        });
        strict_1.default.deepEqual(entry, {
            source: "shimizacken/agent",
            sourceType: "github",
            skillPath: "skills/shortcuts/SKILL.md",
            computedHash: "abc123",
        });
    });
});
