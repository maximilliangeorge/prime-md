// Types
export type {
  PrimeUri,
  PrimeAliasUri,
  PrimeRepoUri,
  ParsedUri,
  PremiseRef,
  PrimeNode,
  PrimeManifest,
  ArgumentGraph,
  ValidationError,
  ValidationResult,
} from "./types.js";
export { isAliasUri } from "./types.js";

// Parsing
export { parseNode, parseNodeFromContent } from "./parse.js";

// Discovery
export { discoverNodes } from "./discover.js";

// URI handling
export {
  parseUri,
  expandAlias,
  parseRepoUri,
  isRemoteUrl,
  canonicalUrl,
} from "./uri.js";

// Git cache
export {
  ensureCached,
  getDefaultBranch,
  readCachedFile,
  readCachedFileByRef,
  listCachedFiles,
} from "./cache.js";

// Manifest
export {
  parseManifestContent,
  loadManifest,
  loadManifestFromCache,
} from "./manifest.js";

// Remote resolution
export { hasRemotePremises, resolveAllPremises } from "./resolve.js";

// Graph construction & validation
export { buildGraph, detectCycles, validate } from "./graph-builder.js";

// Formatting
export type {
  FormatOptions,
  TreeFormatOptions,
  StructuredLine,
} from "./format.js";
export {
  formatList,
  formatTree,
  formatDot,
  formatJson,
  formatRefs,
  formatListStructured,
  formatTreeStructured,
  formatNodeDetail,
  countArguments,
} from "./format.js";

// Repo loading (high-level)
export type { RepoSourceResult } from "./repo-source.js";
export { loadRepoSource } from "./repo-source.js";
