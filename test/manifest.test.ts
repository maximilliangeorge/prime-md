import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { loadManifest } from "../src/manifest.js";

const fixtures = path.resolve(__dirname, "fixtures");

describe("loadManifest", () => {
  it("loads valid prime.yaml with remotes and exports", () => {
    const manifest = loadManifest(path.join(fixtures, "manifest"));
    expect(manifest.remotes).toEqual({
      descartes: "github.com/descartes/meditations",
      gettier: "github.com/gettier/original-paper@abc123def",
      "custom-ref": "github.com/owner/repo/develop",
    });
    expect(manifest.exports).toEqual(["cogito.md", "existence-of-god.md"]);
  });

  it("returns defaults when file is missing", () => {
    const manifest = loadManifest(path.join(fixtures, "valid-tree"));
    expect(manifest.remotes).toEqual({});
    expect(manifest.exports).toEqual([]);
  });
});
