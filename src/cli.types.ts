export const AGENTS = ["copilot", "claude", "codex"] as const;

export type Agent = (typeof AGENTS)[number];

export interface ManifestEntry {
  source: string;
  sourceType: string;
  skillPath: string;
  computedHash: string;
}

export interface Manifest {
  version: 1;
  agents: Agent[];
  skills: Record<string, ManifestEntry>;
  prompts: Record<string, ManifestEntry>;
}

export interface Prompter {
  ask: (question: string) => Promise<string>;
  close: () => void;
}

export interface ExistingSelection {
  agents: Agent[];
  skills: string[];
  prompts: string[];
}
