import type { PrimeUri, PrimeAliasUri, PrimeRepoUri, ParsedUri, PrimeManifest } from "./types.js";

// @alias/path...
const ALIAS_RE = /^@([^/]+)\/(.+)$/;

// https://github.com/owner/repo/blob/ref/path...
const GITHUB_URL_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;

// Repo-level URLs (no file path)
// https://github.com/owner/repo (optionally with .git)
const GITHUB_REPO_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/;

// https://github.com/owner/repo@ref (branch or commit pinned with @)
const GITHUB_REPO_AT_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/@]+)@([^/]+)\/?$/;

// https://github.com/owner/repo/tree/ref
const GITHUB_TREE_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+(?:\/[^/]+)*)$/;

export function parseUri(raw: string): ParsedUri | null {
  let match: RegExpMatchArray | null;

  match = raw.match(ALIAS_RE);
  if (match) {
    return { alias: match[1], path: match[2] };
  }

  match = raw.match(GITHUB_URL_RE);
  if (match) {
    return {
      host: "github.com",
      owner: match[1],
      repo: match[2],
      ref: match[3],
      commit: null,
      path: match[4],
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

  // Try to parse as a repo-level URL
  const repoUri = parseRepoUri(remote);
  if (repoUri) {
    return {
      host: repoUri.host,
      owner: repoUri.owner,
      repo: repoUri.repo,
      ref: repoUri.ref,
      commit: repoUri.commit,
      path: aliasUri.path,
      immutable: repoUri.immutable,
    };
  }

  return null;
}

export function parseRepoUri(raw: string): PrimeRepoUri | null {
  let match: RegExpMatchArray | null;

  match = raw.match(GITHUB_TREE_RE);
  if (match) {
    return {
      host: "github.com",
      owner: match[1],
      repo: match[2],
      ref: match[3],
      commit: null,
      immutable: false,
    };
  }

  match = raw.match(GITHUB_REPO_AT_RE);
  if (match) {
    return {
      host: "github.com",
      owner: match[1],
      repo: match[2],
      ref: match[3],
      commit: null,
      immutable: false,
    };
  }

  match = raw.match(GITHUB_REPO_RE);
  if (match) {
    return {
      host: "github.com",
      owner: match[1],
      repo: match[2],
      ref: "main",
      commit: null,
      immutable: false,
      defaultRef: true,
    };
  }

  return null;
}

export function isRemoteUrl(input: string): boolean {
  return input.startsWith("https://") || input.startsWith("@");
}

export function canonicalUrl(uri: PrimeUri): string {
  return `https://${uri.host}/${uri.owner}/${uri.repo}/blob/${uri.ref}/${uri.path}`;
}
