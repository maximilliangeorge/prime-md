import * as path from "node:path";
import chalk from "chalk";
import { discoverNodes } from "../discover.js";
import { parseNode } from "../parse.js";
import { buildGraph, validate } from "../graph-builder.js";
import { loadManifest } from "../manifest.js";
import { resolveAllPremises } from "../resolve.js";

export async function validateCommand(directory: string): Promise<void> {
  const rootDir = path.resolve(directory);
  const files = discoverNodes(rootDir);

  if (files.length === 0) {
    console.log(chalk.yellow("No node files found."));
    process.exit(0);
  }

  const nodes = files.map((f) => parseNode(f, rootDir));

  // Resolve remote premises
  const manifest = loadManifest(rootDir);
  const remoteNodes = await resolveAllPremises(nodes, rootDir, manifest);

  const graph = buildGraph([...nodes, ...remoteNodes]);
  const result = validate(graph, rootDir);

  for (const warning of result.warnings) {
    console.log(chalk.yellow(`  warning: ${warning.file}: ${warning.message}`));
  }

  for (const error of result.errors) {
    console.log(chalk.red(`  error: ${error.file}: ${error.message}`));
  }

  if (result.valid) {
    console.log(
      chalk.green(`Valid. ${graph.nodes.size} nodes, ${graph.edges.length} edges.`)
    );
    process.exit(0);
  } else {
    console.log(
      chalk.red(
        `Invalid. ${result.errors.length} error(s), ${result.warnings.length} warning(s).`
      )
    );
    process.exit(1);
  }
}
