import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { discoverNodes } from "../src/discover.js";

const fixtures = path.resolve(__dirname, "fixtures");

describe("discoverNodes", () => {
  it("discovers .md files recursively", () => {
    const nodes = discoverNodes(path.join(fixtures, "valid-tree"));
    const basenames = nodes.map((n) => path.basename(n));
    expect(basenames).toContain("cogito.md");
    expect(basenames).toContain("thinking-is-self-evident.md");
    expect(basenames).toContain("doubt-presupposes-a-doubter.md");
    expect(nodes).toHaveLength(3);
  });

  it("excludes README.md at any depth", () => {
    const nodes = discoverNodes(path.join(fixtures, "ignore-rules"));
    const basenames = nodes.map((n) => path.basename(n));
    expect(basenames).not.toContain("README.md");
  });

  it("excludes files starting with _", () => {
    const nodes = discoverNodes(path.join(fixtures, "ignore-rules"));
    const basenames = nodes.map((n) => path.basename(n));
    expect(basenames).not.toContain("_notes.md");
  });

  it("discovers non-ignored files in ignore-rules fixture", () => {
    const nodes = discoverNodes(path.join(fixtures, "ignore-rules"));
    const basenames = nodes.map((n) => path.basename(n));
    expect(basenames).toContain("real-node.md");
    expect(nodes).toHaveLength(1);
  });
});
