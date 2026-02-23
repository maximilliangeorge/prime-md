import * as fs from "node:fs";
import * as path from "node:path";
import yaml from "js-yaml";
import type { PrimeManifest } from "./types.js";

export function loadManifest(rootDir: string): PrimeManifest {
  const manifestPath = path.join(rootDir, "prime.yaml");

  if (!fs.existsSync(manifestPath)) {
    return { remotes: {}, exports: [] };
  }

  const content = fs.readFileSync(manifestPath, "utf-8");
  const data = yaml.load(content) as Record<string, unknown> | null;

  if (!data || typeof data !== "object") {
    return { remotes: {}, exports: [] };
  }

  const remotes: Record<string, string> = {};
  if (data.remotes && typeof data.remotes === "object") {
    for (const [key, value] of Object.entries(
      data.remotes as Record<string, unknown>
    )) {
      remotes[key] = String(value);
    }
  }

  const exports: string[] = Array.isArray(data.exports)
    ? data.exports.map(String)
    : [];

  return { remotes, exports };
}
