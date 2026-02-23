import * as fs from "node:fs";
import * as path from "node:path";

function isIgnored(filePath: string): boolean {
  const basename = path.basename(filePath);
  if (basename === "README.md") return true;
  if (basename.startsWith("_")) return true;
  return false;
}

function walkDir(dir: string, results: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walkDir(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      if (!isIgnored(fullPath)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

export function discoverNodes(rootDir: string): string[] {
  const absRoot = path.resolve(rootDir);
  return walkDir(absRoot).sort();
}
