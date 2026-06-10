#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", ".github");
const dest = path.join(process.cwd(), ".github");

const collectFiles = (dir, base) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    const rel = path.join(base, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(full, rel);
    }

    return [{ full, rel }];
  });
};

const writeFile = (srcPath, relPath) => {
  const destPath = path.join(dest, relPath);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log(`  wrote  ${path.join(".github", relPath)}`);
};

const files = collectFiles(src, "");

files.forEach(({ full, rel }) => writeFile(full, rel));

console.log(`\ndone - ${files.length} file(s) copied to .github/`);
