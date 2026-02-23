import { describe, it, expect } from "vitest";
import { parseUri, expandAlias } from "../src/uri.js";
import { isAliasUri } from "../src/types.js";
import type { PrimeAliasUri, PrimeManifest, PrimeUri } from "../src/types.js";

describe("parseUri", () => {
  it("parses mutable URI", () => {
    const uri = parseUri("prime://github.com/owner/repo/main/path/to/file.md");
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

  it("parses immutable URI", () => {
    const uri = parseUri("prime://github.com/owner/repo@abc123/path/to/file.md");
    expect(uri).not.toBeNull();
    const u = uri as PrimeUri;
    expect(u.host).toBe("github.com");
    expect(u.owner).toBe("owner");
    expect(u.repo).toBe("repo");
    expect(u.ref).toBe("abc123");
    expect(u.commit).toBe("abc123");
    expect(u.path).toBe("path/to/file.md");
    expect(u.immutable).toBe(true);
  });

  it("parses alias URI", () => {
    const uri = parseUri("prime://@descartes/cogito.md");
    expect(uri).not.toBeNull();
    expect(isAliasUri(uri!)).toBe(true);
    const u = uri as PrimeAliasUri;
    expect(u.alias).toBe("descartes");
    expect(u.path).toBe("cogito.md");
  });

  it("returns null for invalid URI", () => {
    expect(parseUri("https://example.com")).toBeNull();
    expect(parseUri("not-a-uri")).toBeNull();
  });
});

describe("expandAlias", () => {
  const manifest: PrimeManifest = {
    remotes: {
      descartes: "github.com/descartes/meditations",
      gettier: "github.com/gettier/original-paper@abc123def",
      custom: "github.com/owner/repo/develop",
    },
    exports: [],
  };

  it("expands alias with host/owner/repo remote (defaults to main)", () => {
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

  it("expands alias with commit ref (immutable)", () => {
    const alias: PrimeAliasUri = { alias: "gettier", path: "paper.md" };
    const result = expandAlias(alias, manifest);
    expect(result).not.toBeNull();
    expect(result!.commit).toBe("abc123def");
    expect(result!.immutable).toBe(true);
    expect(result!.ref).toBe("abc123def");
  });

  it("expands alias with custom ref", () => {
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
