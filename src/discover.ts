import * as fs from "node:fs";
import * as path from "node:path";
import ignore, { type Ignore } from "ignore";

function isIgnored(filePath: string): boolean {
  const basename = path.basename(filePath);
  if (basename === "README.md") return true;
  if (basename.startsWith("_")) return true;
  return false;
}

function loadGitignore(dir: string): Ignore | null {
  const igPath = path.join(dir, ".gitignore");
  if (!fs.existsSync(igPath)) return null;
  const ig = ignore();
  ig.add(fs.readFileSync(igPath, "utf-8"));
  return ig;
}

function walkDir(
  dir: string,
  rootDir: string,
  parentIgnore: Ignore,
  results: string[] = [],
): string[] {
  // Merge any .gitignore in this directory
  const localIg = loadGitignore(dir);
  const ig = localIg ? ignore().add(parentIgnore).add(localIg) : parentIgnore;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (entry.name.startsWith(".")) continue;
      if (entry.name === "node_modules") continue;
      if (ig.ignores(relPath + "/")) continue;
      walkDir(fullPath, rootDir, ig, results);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      if (isIgnored(fullPath)) continue;
      if (ig.ignores(relPath)) continue;
      results.push(fullPath);
    }
  }
  return results;
}

export function discoverNodes(rootDir: string): string[] {
  const absRoot = path.resolve(rootDir);
  const rootIgnore = loadGitignore(absRoot) ?? ignore();
  return walkDir(absRoot, absRoot, rootIgnore).sort();
}
