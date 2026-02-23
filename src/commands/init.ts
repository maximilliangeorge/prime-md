import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "chalk";
import { simpleGit } from "simple-git";

const SAMPLE_AXIOM = `# First principles are self-evident

A first principle is a foundational proposition that cannot be deduced
from any other proposition. It is known by intuition rather than by proof.
`;

const SAMPLE_MANIFEST = `remotes: {}

exports: []
`;

export async function initCommand(directory: string): Promise<void> {
  const rootDir = path.resolve(directory);

  // Ensure directory exists
  fs.mkdirSync(rootDir, { recursive: true });

  // Git init if needed
  const gitDir = path.join(rootDir, ".git");
  if (!fs.existsSync(gitDir)) {
    const git = simpleGit(rootDir);
    await git.init();
    console.log(chalk.green("Initialized git repository."));
  }

  // Write sample axiom
  const axiomPath = path.join(rootDir, "first-principles.md");
  if (!fs.existsSync(axiomPath)) {
    fs.writeFileSync(axiomPath, SAMPLE_AXIOM);
    console.log(chalk.green("Created first-principles.md"));
  }

  // Write prime.yaml
  const manifestPath = path.join(rootDir, "prime.yaml");
  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, SAMPLE_MANIFEST);
    console.log(chalk.green("Created prime.yaml"));
  }

  console.log(chalk.green("\nprime repository initialized."));
}
