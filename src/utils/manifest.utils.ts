import crypto from "crypto";
import path from "path";

import type { ManifestEntry } from "../cli.types";

export const MANIFEST_FILE = ".agent-manifest.json";
export const MANIFEST_SOURCE = "shimizacken/agent";
export const MANIFEST_SOURCE_TYPE = "github";

export const computeHashFromBuffer = (buffer: Buffer): string =>
  crypto.createHash("sha256").update(buffer).digest("hex");

export interface BuildManifestEntryOptions {
  srcRoot: string;
  filePath: string;
  computedHash: string;
}

export const buildManifestEntry = ({
  srcRoot,
  filePath,
  computedHash,
}: BuildManifestEntryOptions): ManifestEntry => ({
  source: MANIFEST_SOURCE,
  sourceType: MANIFEST_SOURCE_TYPE,
  skillPath: path.relative(srcRoot, filePath),
  computedHash,
});
