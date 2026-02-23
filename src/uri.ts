import type { PrimeUri, PrimeAliasUri, ParsedUri, PrimeManifest } from "./types.js";

// prime://host/owner/repo/ref/path...
const MUTABLE_RE =
  /^prime:\/\/([^/]+)\/([^/]+)\/([^/]+)\/([^/@]+)\/(.+)$/;

// prime://host/owner/repo@commit/path...
const IMMUTABLE_RE =
  /^prime:\/\/([^/]+)\/([^/]+)\/([^/@]+)@([^/]+)\/(.+)$/;

// prime://@alias/path...
const ALIAS_RE = /^prime:\/\/@([^/]+)\/(.+)$/;

export function parseUri(raw: string): ParsedUri | null {
  let match: RegExpMatchArray | null;

  match = raw.match(ALIAS_RE);
  if (match) {
    return { alias: match[1], path: match[2] };
  }

  match = raw.match(IMMUTABLE_RE);
  if (match) {
    return {
      host: match[1],
      owner: match[2],
      repo: match[3],
      ref: match[4],
      commit: match[4],
      path: match[5],
      immutable: true,
    };
  }

  match = raw.match(MUTABLE_RE);
  if (match) {
    return {
      host: match[1],
      owner: match[2],
      repo: match[3],
      ref: match[4],
      commit: null,
      path: match[5],
      immutable: false,
    };
  }

  return null;
}

export function expandAlias(
  aliasUri: PrimeAliasUri,
  manifest: PrimeManifest
): PrimeUri | null {
  const remote = manifest.remotes[aliasUri.alias];
  if (!remote) return null;

  // remote is "host/owner/repo" or "host/owner/repo@commit" or "host/owner/repo/ref"
  const commitMatch = remote.match(/^([^/]+)\/([^/]+)\/([^/@]+)@(.+)$/);
  if (commitMatch) {
    return {
      host: commitMatch[1],
      owner: commitMatch[2],
      repo: commitMatch[3],
      ref: commitMatch[4],
      commit: commitMatch[4],
      path: aliasUri.path,
      immutable: true,
    };
  }

  const refMatch = remote.match(/^([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
  if (refMatch) {
    return {
      host: refMatch[1],
      owner: refMatch[2],
      repo: refMatch[3],
      ref: refMatch[4],
      commit: null,
      path: aliasUri.path,
      immutable: false,
    };
  }

  // Default: host/owner/repo — use "main" as default ref
  const parts = remote.split("/");
  if (parts.length === 3) {
    return {
      host: parts[0],
      owner: parts[1],
      repo: parts[2],
      ref: "main",
      commit: null,
      path: aliasUri.path,
      immutable: false,
    };
  }

  return null;
}
