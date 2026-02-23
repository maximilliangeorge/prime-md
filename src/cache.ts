import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { simpleGit } from "simple-git";
import type { PrimeUri } from "./types.js";

function getCacheDir(uri: PrimeUri): string {
  return path.join(
    os.homedir(),
    ".prime",
    "cache",
    uri.host,
    uri.owner,
    uri.repo
  );
}

function getCloneUrl(uri: PrimeUri): string {
  return `https://${uri.host}/${uri.owner}/${uri.repo}.git`;
}

export async function ensureCached(uri: PrimeUri): Promise<string> {
  const cacheDir = getCacheDir(uri);

  if (fs.existsSync(path.join(cacheDir, "HEAD"))) {
    // Already cloned — fetch if mutable
    if (!uri.immutable) {
      const git = simpleGit(cacheDir);
      await git.fetch(["origin"]);
    }
  } else {
    // Bare clone
    fs.mkdirSync(cacheDir, { recursive: true });
    const git = simpleGit();
    await git.clone(getCloneUrl(uri), cacheDir, ["--bare"]);
  }

  return cacheDir;
}

export async function readCachedFile(
  uri: PrimeUri,
  cacheDir: string
): Promise<string | null> {
  const git = simpleGit(cacheDir);
  const ref = uri.commit || `origin/${uri.ref}`;

  try {
    const content = await git.show([`${ref}:${uri.path}`]);
    return content;
  } catch {
    return null;
  }
}
