import { describe, it, expect, vi, beforeEach } from "vitest";
import * as path from "node:path";
import { parseNodeFromContent } from "../src/parse.js";

const fixtures = path.resolve(__dirname, "fixtures");

describe("show command — parseNodeFromContent", () => {
  it("parses axiom content correctly", () => {
    const content = `# Thinking is self-evident

The act of thinking requires no external proof.`;
    const node = parseNodeFromContent(content, "/test/axiom.md", "/test");

    expect(node.claim).toBe("Thinking is self-evident");
    expect(node.isAxiom).toBe(true);
    expect(node.premises).toHaveLength(0);
    expect(node.relativePath).toBe("axiom.md");
  });

  it("parses derived node with premises", () => {
    const content = `---
premises:
  - ./axiom-a.md
  - ./axiom-b.md
---

# Derived claim

Body text here.`;
    const node = parseNodeFromContent(content, "/test/derived.md", "/test");

    expect(node.claim).toBe("Derived claim");
    expect(node.isAxiom).toBe(false);
    expect(node.premises).toHaveLength(2);
    expect(node.premises[0].kind).toBe("local");
    expect(node.premises[0].raw).toBe("./axiom-a.md");
    expect(node.premises[1].raw).toBe("./axiom-b.md");
  });

  it("parses remote premise references", () => {
    const content = `---
premises:
  - https://github.com/org/repo/blob/main/node.md
---

# Node with remote dep`;
    const node = parseNodeFromContent(content, "/test/node.md", "/test");

    expect(node.premises).toHaveLength(1);
    expect(node.premises[0].kind).toBe("remote");
    expect(node.premises[0].raw).toBe(
      "https://github.com/org/repo/blob/main/node.md"
    );
  });

  it("returns null claim when H1 is missing", () => {
    const content = "Just some text without a heading.";
    const node = parseNodeFromContent(content, "/test/no-h1.md", "/test");

    expect(node.claim).toBeNull();
  });

  it("works with a GitHub URL as filePath (remote scenario)", () => {
    const content = `# Remote axiom

Some body.`;
    const url = "https://github.com/org/repo/blob/main/axiom.md";
    const node = parseNodeFromContent(content, url, url);

    expect(node.claim).toBe("Remote axiom");
    expect(node.filePath).toBe(url);
  });
});
