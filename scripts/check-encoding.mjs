import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checkedExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".prisma",
  ".ts",
  ".tsx"
]);
const ignoredDirectories = new Set([".git", ".next", ".vercel", "node_modules", "public"]);
const ignoredFiles = new Set(["package-lock.json"]);

const c1Controls = "[\\u0080-\\u009f]";
const replacementChar = "\\ufffd";
const twoByteLead = "[\\u00c2-\\u00c6][\\u0080-\\u00bf]";
const threeByteLead = "\\u00e1[\\u00ba-\\u00bf]";
const suspiciousVietnameseMojibake = "\\u0112";
const knownBrokenWords = ["hi\\u1ed2u", "th\\u1ed2"];
const mojibakePattern = new RegExp(
  `${c1Controls}|${replacementChar}|${twoByteLead}|${threeByteLead}|${suspiciousVietnameseMojibake}|${knownBrokenWords.join("|")}`
);

function shouldCheck(filePath) {
  if (ignoredFiles.has(path.basename(filePath))) return false;
  return checkedExtensions.has(path.extname(filePath));
}

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...walk(entryPath));
      continue;
    }

    if (entry.isFile() && shouldCheck(entryPath)) files.push(entryPath);
  }

  return files;
}

const failures = [];

for (const filePath of walk(root)) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const match = mojibakePattern.exec(line);
    if (!match) return;

    failures.push({
      filePath: path.relative(root, filePath),
      line: index + 1,
      column: match.index + 1
    });
  });
}

if (failures.length > 0) {
  console.error("Encoding check failed. Possible mojibake or broken UTF-8 text found:");
  for (const failure of failures) {
    console.error(`- ${failure.filePath}:${failure.line}:${failure.column}`);
  }
  process.exit(1);
}

console.log("Encoding check passed.");
