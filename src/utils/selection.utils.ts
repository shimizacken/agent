export const getSelectionKey = (
  type: "skill" | "prompt",
  value: string,
): string => `${type}:${value}`;

export const getRemovedItems = <T>(existingItems: T[], finalItems: T[]): T[] =>
  existingItems.filter((item) => !finalItems.includes(item));
