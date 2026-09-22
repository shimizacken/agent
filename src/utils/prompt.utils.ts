export const getPromptLabel = (file: string): string =>
  file.replace(/\.prompt\.md$/, "");

export const parsePromptSelection = (
  raw: string,
  prompts: string[],
): string[] => {
  const indices = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => !isNaN(i) && i >= 0 && i < prompts.length);

  return indices.map((i) => prompts[i]);
};
