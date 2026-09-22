"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildManifestEntry = exports.computeHashFromBuffer = exports.MANIFEST_SOURCE_TYPE = exports.MANIFEST_SOURCE = exports.MANIFEST_FILE = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
exports.MANIFEST_FILE = ".agent-manifest.json";
exports.MANIFEST_SOURCE = "shimizacken/agent";
exports.MANIFEST_SOURCE_TYPE = "github";
const computeHashFromBuffer = (buffer) => crypto_1.default.createHash("sha256").update(buffer).digest("hex");
exports.computeHashFromBuffer = computeHashFromBuffer;
const buildManifestEntry = ({ srcRoot, filePath, computedHash, }) => ({
    source: exports.MANIFEST_SOURCE,
    sourceType: exports.MANIFEST_SOURCE_TYPE,
    skillPath: path_1.default.relative(srcRoot, filePath),
    computedHash,
});
exports.buildManifestEntry = buildManifestEntry;
