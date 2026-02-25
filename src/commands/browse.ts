import * as path from 'node:path'
import chalk from 'chalk'
import ora from 'ora'
import { discoverNodes } from '../discover.js'
import { parseNode } from '../parse.js'
import { buildGraph } from '../graph-builder.js'
import { loadManifest } from '../manifest.js'
import { resolveAllPremises, hasRemotePremises } from '../resolve.js'
import { initTui } from '../tui/index.js'

export async function browseCommand(directory: string): Promise<void> {
  const rootDir = path.resolve(directory)
  const files = discoverNodes(rootDir)

  if (files.length === 0) {
    console.log(chalk.yellow('No node files found.'))
    process.exit(0)
  }

  const nodes = files.map((f) => parseNode(f, rootDir))

  // Resolve remote premises
  const manifest = loadManifest(rootDir)
  const spinner = hasRemotePremises(nodes) ? ora('Fetching remote arguments…').start() : null
  const remoteNodes = await resolveAllPremises(nodes, rootDir, manifest)
  if (spinner) spinner.succeed(`Fetched ${remoteNodes.length} remote node${remoteNodes.length === 1 ? '' : 's'}`)

  const graph = buildGraph([...nodes, ...remoteNodes])

  initTui(graph, rootDir)
}
