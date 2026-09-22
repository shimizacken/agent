"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemovedItems = exports.getSelectionKey = void 0;
const getSelectionKey = (type, value) => `${type}:${value}`;
exports.getSelectionKey = getSelectionKey;
const getRemovedItems = (existingItems, finalItems) => existingItems.filter((item) => !finalItems.includes(item));
exports.getRemovedItems = getRemovedItems;
