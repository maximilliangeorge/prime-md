import type { ArgumentGraph, PrimeNode } from "./types.js";

function findRoots(graph: ArgumentGraph): string[] {
  const hasIncoming = new Set<string>();
  for (const edge of graph.edges) {
    hasIncoming.add(edge.to);
  }
  const roots: string[] = [];
  for (const key of graph.nodes.keys()) {
    if (!hasIncoming.has(key)) {
      roots.push(key);
    }
  }
  return roots.sort();
}

function getChildren(graph: ArgumentGraph, nodeKey: string): string[] {
  return graph.edges
    .filter((e) => e.from === nodeKey)
    .map((e) => e.to)
    .sort();
}

export function formatTree(graph: ArgumentGraph): string {
  const roots = findRoots(graph);
  if (roots.length === 0 && graph.nodes.size > 0) {
    // All nodes in cycles — just list them
    return Array.from(graph.nodes.values())
      .map((n) => n.relativePath)
      .join("\n");
  }

  const lines: string[] = [];
  const visited = new Set<string>();

  function walk(key: string, prefix: string, isLast: boolean, isRoot: boolean): void {
    const node = graph.nodes.get(key);
    if (!node) return;

    const connector = isRoot ? "" : isLast ? "└── " : "├── ";
    const label = node.claim || node.relativePath;
    const suffix = node.isAxiom ? " [axiom]" : "";

    if (visited.has(key)) {
      lines.push(`${prefix}${connector}${label}${suffix} (ref)`);
      return;
    }
    visited.add(key);

    lines.push(`${prefix}${connector}${label}${suffix}`);

    const children = getChildren(graph, key);
    const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
    children.forEach((child, i) => {
      walk(child, childPrefix, i === children.length - 1, false);
    });
  }

  roots.forEach((root, i) => {
    walk(root, "", i === roots.length - 1, true);
    if (i < roots.length - 1) lines.push("");
  });

  return lines.join("\n");
}

export function formatDot(graph: ArgumentGraph): string {
  const lines: string[] = ["digraph prime {", '  rankdir=BT;', ""];

  // Node declarations
  for (const [key, node] of graph.nodes) {
    const label = (node.claim || node.relativePath).replace(/"/g, '\\"');
    const shape = node.isAxiom ? "box" : "ellipse";
    lines.push(`  "${node.relativePath}" [label="${label}", shape=${shape}];`);
  }

  lines.push("");

  // Edges (from node to premise, i.e. "depends on")
  for (const edge of graph.edges) {
    const fromNode = graph.nodes.get(edge.from);
    const toNode = graph.nodes.get(edge.to);
    if (fromNode && toNode) {
      lines.push(`  "${fromNode.relativePath}" -> "${toNode.relativePath}";`);
    }
  }

  lines.push("}");
  return lines.join("\n");
}

export function formatJson(graph: ArgumentGraph): string {
  const nodes: Record<string, object> = {};
  for (const [key, node] of graph.nodes) {
    nodes[node.relativePath] = {
      claim: node.claim,
      isAxiom: node.isAxiom,
      premises: node.premises.map((p) => p.raw),
    };
  }

  const edges = graph.edges.map((e) => ({
    from: graph.nodes.get(e.from)?.relativePath || e.from,
    to: graph.nodes.get(e.to)?.relativePath || e.to,
  }));

  return JSON.stringify({ nodes, edges }, null, 2);
}
