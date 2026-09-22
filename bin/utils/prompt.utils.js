"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePromptSelection = exports.getPromptLabel = void 0;
const getPromptLabel = (file) => file.replace(/\.prompt\.md$/, "");
exports.getPromptLabel = getPromptLabel;
const parsePromptSelection = (raw, prompts) => {
    const indices = raw
        .split(",")
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((i) => !isNaN(i) && i >= 0 && i < prompts.length);
    return indices.map((i) => prompts[i]);
};
exports.parsePromptSelection = parsePromptSelection;
