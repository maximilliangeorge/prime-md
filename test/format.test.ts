import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { parseNode } from "../src/parse.js";
import { buildGraph } from "../src/graph-builder.js";
import { formatTree, formatDot, formatJson } from "../src/format.js";

const fixtures = path.resolve(__dirname, "fixtures");

function buildValidTreeGraph() {
  const rootDir = path.join(fixtures, "valid-tree");
  const files = [
    "thinking-is-self-evident.md",
    "doubt-presupposes-a-doubter.md",
    "cogito.md",
  ];
  const nodes = files.map((f) => parseNode(path.join(rootDir, f), rootDir));
  return buildGraph(nodes);
}

describe("formatTree", () => {
  it("shows hierarchy with box-drawing chars", () => {
    const graph = buildValidTreeGraph();
    const output = formatTree(graph);

    expect(output).toContain("I think, therefore I am");
    expect(output).toContain("[axiom]");
    // Should contain tree connectors
    expect(output).toMatch(/[├└]── /);
  });

  it("marks axioms with [axiom]", () => {
    const graph = buildValidTreeGraph();
    const output = formatTree(graph);

    expect(output).toContain("Thinking is self-evident [axiom]");
    expect(output).toContain("Doubt presupposes a doubter [axiom]");
  });
});

describe("formatDot", () => {
  it("produces valid digraph", () => {
    const graph = buildValidTreeGraph();
    const output = formatDot(graph);

    expect(output).toContain("digraph prime {");
    expect(output).toContain("rankdir=BT");
    expect(output).toContain("shape=box"); // axioms
    expect(output).toContain("shape=ellipse"); // non-axioms
    expect(output).toContain("->"); // edges
    expect(output.trim()).toMatch(/}$/); // closes the digraph
  });
});

describe("formatJson", () => {
  it("produces parseable JSON with correct structure", () => {
    const graph = buildValidTreeGraph();
    const output = formatJson(graph);
    const parsed = JSON.parse(output);

    expect(parsed).toHaveProperty("nodes");
    expect(parsed).toHaveProperty("edges");

    // Check nodes
    expect(parsed.nodes["cogito.md"]).toBeDefined();
    expect(parsed.nodes["cogito.md"].claim).toBe("I think, therefore I am");
    expect(parsed.nodes["cogito.md"].isAxiom).toBe(false);
    expect(parsed.nodes["cogito.md"].premises).toHaveLength(2);

    expect(parsed.nodes["thinking-is-self-evident.md"].isAxiom).toBe(true);

    // Check edges
    expect(parsed.edges).toHaveLength(2);
    for (const edge of parsed.edges) {
      expect(edge.from).toBe("cogito.md");
    }
  });
});
