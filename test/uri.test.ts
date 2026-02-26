import { describe, it, expect } from "vitest";
import { parseUri, expandAlias, parseRepoUri, isRemoteUrl } from "../src/uri.js";
import { isAliasUri } from "../src/types.js";
import type { PrimeAliasUri, PrimeManifest, PrimeUri } from "../src/types.js";

describe("parseUri", () => {
  it("parses GitHub blob URL", () => {
    const uri = parseUri("https://github.com/owner/repo/blob/main/path/to/file.md");
    expect(uri).not.toBeNull();
    expect(isAliasUri(uri!)).toBe(false);
    const u = uri as PrimeUri;
    expect(u.host).toBe("github.com");
    expect(u.owner).toBe("owner");
    expect(u.repo).toBe("repo");
    expect(u.ref).toBe("main");
    expect(u.path).toBe("path/to/file.md");
    expect(u.commit).toBeNull();
    expect(u.immutable).toBe(false);
  });

  it("parses GitHub blob URL with branch name", () => {
    const uri = parseUri("https://github.com/descartes/meditations/blob/develop/cogito.md");
    expect(uri).not.toBeNull();
    const u = uri as PrimeUri;
    expect(u.owner).toBe("descartes");
    expect(u.repo).toBe("meditations");
    expect(u.ref).toBe("develop");
    expect(u.path).toBe("cogito.md");
  });

  it("parses alias reference", () => {
    const uri = parseUri("@descartes/cogito.md");
    expect(uri).not.toBeNull();
    expect(isAliasUri(uri!)).toBe(true);
    const u = uri as PrimeAliasUri;
    expect(u.alias).toBe("descartes");
    expect(u.path).toBe("cogito.md");
  });

  it("returns null for non-blob GitHub URL", () => {
    expect(parseUri("https://github.com/owner/repo")).toBeNull();
    expect(parseUri("https://github.com/owner/repo/tree/main")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseUri("https://example.com")).toBeNull();
    expect(parseUri("not-a-uri")).toBeNull();
  });
});

describe("expandAlias", () => {
  const manifest: PrimeManifest = {
    remotes: {
      descartes: "https://github.com/descartes/meditations",
      gettier: "https://github.com/gettier/original-paper@abc123def",
      custom: "https://github.com/owner/repo/tree/develop",
    },
    exports: [],
  };

  it("expands alias with bare repo URL (defaults to main)", () => {
    const alias: PrimeAliasUri = { alias: "descartes", path: "cogito.md" };
    const result = expandAlias(alias, manifest);
    expect(result).not.toBeNull();
    expect(result!.host).toBe("github.com");
    expect(result!.owner).toBe("descartes");
    expect(result!.repo).toBe("meditations");
    expect(result!.ref).toBe("main");
    expect(result!.commit).toBeNull();
    expect(result!.path).toBe("cogito.md");
    expect(result!.immutable).toBe(false);
  });

  it("expands alias with @ref", () => {
    const alias: PrimeAliasUri = { alias: "gettier", path: "paper.md" };
    const result = expandAlias(alias, manifest);
    expect(result).not.toBeNull();
    expect(result!.ref).toBe("abc123def");
    expect(result!.path).toBe("paper.md");
  });

  it("expands alias with tree URL ref", () => {
    const alias: PrimeAliasUri = { alias: "custom", path: "file.md" };
    const result = expandAlias(alias, manifest);
    expect(result).not.toBeNull();
    expect(result!.ref).toBe("develop");
    expect(result!.commit).toBeNull();
    expect(result!.immutable).toBe(false);
  });

  it("returns null for unknown alias", () => {
    const alias: PrimeAliasUri = { alias: "unknown", path: "file.md" };
    const result = expandAlias(alias, manifest);
    expect(result).toBeNull();
  });
});

describe("parseRepoUri", () => {
  it("parses bare GitHub repo URL", () => {
    const uri = parseRepoUri("https://github.com/owner/repo");
    expect(uri).not.toBeNull();
    expect(uri!.host).toBe("github.com");
    expect(uri!.owner).toBe("owner");
    expect(uri!.repo).toBe("repo");
    expect(uri!.ref).toBe("main");
    expect(uri!.commit).toBeNull();
    expect(uri!.immutable).toBe(false);
  });

  it("strips .git suffix", () => {
    const uri = parseRepoUri("https://github.com/owner/repo.git");
    expect(uri).not.toBeNull();
    expect(uri!.repo).toBe("repo");
  });

  it("parses GitHub tree URL with ref", () => {
    const uri = parseRepoUri("https://github.com/owner/repo/tree/develop");
    expect(uri).not.toBeNull();
    expect(uri!.owner).toBe("owner");
    expect(uri!.repo).toBe("repo");
    expect(uri!.ref).toBe("develop");
  });

  it("parses GitHub repo URL with @ref", () => {
    const uri = parseRepoUri("https://github.com/owner/repo@develop");
    expect(uri).not.toBeNull();
    expect(uri!.owner).toBe("owner");
    expect(uri!.repo).toBe("repo");
    expect(uri!.ref).toBe("develop");
    expect(uri!.commit).toBeNull();
  });

  it("parses GitHub repo URL with @commit", () => {
    const uri = parseRepoUri("https://github.com/owner/repo@abc123def");
    expect(uri).not.toBeNull();
    expect(uri!.ref).toBe("abc123def");
  });

  it("sets defaultRef only for bare repo URL", () => {
    const bare = parseRepoUri("https://github.com/owner/repo");
    expect(bare!.defaultRef).toBe(true);

    const atRef = parseRepoUri("https://github.com/owner/repo@develop");
    expect(atRef!.defaultRef).toBeUndefined();

    const tree = parseRepoUri("https://github.com/owner/repo/tree/main");
    expect(tree!.defaultRef).toBeUndefined();
  });

  it("returns null for file-level URLs", () => {
    expect(parseRepoUri("https://github.com/owner/repo/blob/main/file.md")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseRepoUri("not-a-url")).toBeNull();
    expect(parseRepoUri("./local/path")).toBeNull();
  });
});

describe("isRemoteUrl", () => {
  it("returns true for https:// URLs", () => {
    expect(isRemoteUrl("https://github.com/owner/repo")).toBe(true);
  });

  it("returns true for @ alias references", () => {
    expect(isRemoteUrl("@descartes/cogito.md")).toBe(true);
  });

  it("returns false for local paths", () => {
    expect(isRemoteUrl(".")).toBe(false);
    expect(isRemoteUrl("./some/dir")).toBe(false);
    expect(isRemoteUrl("/absolute/path")).toBe(false);
  });
});
