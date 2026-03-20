import type { Plugin } from 'vite'
import { loadRepoSource } from 'prime-md'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import matter from 'gray-matter'
import * as path from 'node:path'

export interface SerializedNode {
  id: string
  name: string
  body: string
  isAxiom: boolean
  category: string
  premises: string[]
}

export interface SerializedGraph {
  nodes: SerializedNode[]
  edges: { source: string; target: string }[]
  label: string
}

function extractCategory(node: { filePath: string; relativePath: string }): string {
  try {
    const raw = readFileSync(node.filePath, 'utf-8')
    const { data } = matter(raw)
    if (typeof data.category === 'string') return data.category
  } catch {
    // Fall through
  }
  const segments = node.relativePath.split('/')
  if (segments.length > 1) return segments[0]
  return 'uncategorized'
}

export async function buildGraph(source: string): Promise<SerializedGraph> {
  const { nodes, remoteNodes, label } = await loadRepoSource(source)
  const allNodes = [...nodes, ...remoteNodes]

  const filePathToId = new Map<string, string>()
  for (const node of allNodes) {
    const id = node.relativePath.replace(/\.md$/, '')
    filePathToId.set(node.filePath, id)
  }

  for (const node of allNodes) {
    for (const premise of node.premises) {
      if (premise.resolvedPath && !filePathToId.has(premise.resolvedPath)) {
        const target = allNodes.find(n => n.filePath === premise.resolvedPath)
        if (target) {
          filePathToId.set(premise.resolvedPath, target.relativePath.replace(/\.md$/, ''))
        }
      }
    }
  }

  const serializedNodes: SerializedNode[] = allNodes.map((node) => {
    const id = node.relativePath.replace(/\.md$/, '')
    const premiseIds: string[] = []
    for (const p of node.premises) {
      if (p.resolvedPath) {
        const targetId = filePathToId.get(p.resolvedPath)
        if (targetId) premiseIds.push(targetId)
      }
    }

    return {
      id,
      name: node.claim || id.split('/').pop()!.replace(/-/g, ' '),
      body: node.body || '',
      isAxiom: node.isAxiom,
      category: extractCategory(node),
      premises: premiseIds,
    }
  })

  const nodeIdSet = new Set(serializedNodes.map(n => n.id))
  const edges: { source: string; target: string }[] = []
  const seen = new Set<string>()

  for (const node of serializedNodes) {
    for (const premiseId of node.premises) {
      if (nodeIdSet.has(premiseId)) {
        const key = `${premiseId}->${node.id}`
        if (!seen.has(key)) {
          seen.add(key)
          edges.push({ source: premiseId, target: node.id })
        }
      }
    }
  }

  return { nodes: serializedNodes, edges, label }
}

interface ExampleEntry {
  slug: string
  name: string
  description: string
  dir: string
}

function discoverExamples(examplesDir: string): ExampleEntry[] {
  const entries: ExampleEntry[] = []
  for (const name of readdirSync(examplesDir)) {
    const dir = path.join(examplesDir, name)
    if (!statSync(dir).isDirectory()) continue
    // Skip hidden dirs and dirs starting with _
    if (name.startsWith('.') || name.startsWith('_')) continue

    // Read README.md for description if it exists
    let description = ''
    try {
      const readme = readFileSync(path.join(dir, 'README.md'), 'utf-8')
      // First non-empty, non-heading line
      const lines = readme.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('[')) {
          description = trimmed
          break
        }
      }
    } catch {
      // No README
    }

    const displayName = name
      .split('-')
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ')

    entries.push({ slug: name, name: displayName, description, dir })
  }
  return entries
}

export function primePlugin(): Plugin {
  let examples: ExampleEntry[] = []
  let examplesDir: string

  return {
    name: 'prime-examples',
    configResolved(config) {
      examplesDir = path.resolve(config.root, '..', 'examples')
      examples = discoverExamples(examplesDir)
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)

        if (url.pathname === '/api/examples') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(examples.map(e => ({
            slug: e.slug,
            name: e.name,
            description: e.description,
          }))))
          return
        }

        if (url.pathname === '/api/graph') {
          const slug = url.searchParams.get('example')
          const example = examples.find(e => e.slug === slug)
          if (!example) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `Unknown example: ${slug}` }))
            return
          }

          try {
            const result = await buildGraph(example.dir)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err: any) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        next()
      })
    },
    async generateBundle() {
      // Pre-build all examples at compile time
      const manifest: { slug: string; name: string; description: string }[] = []

      for (const example of examples) {
        try {
          const graph = await buildGraph(example.dir)
          this.emitFile({
            type: 'asset',
            fileName: `examples/${example.slug}.json`,
            source: JSON.stringify(graph),
          })
          manifest.push({
            slug: example.slug,
            name: example.name,
            description: example.description,
          })
          console.log(`  ✓ Built ${example.slug} (${graph.nodes.length} nodes)`)
        } catch (err: any) {
          console.warn(`  ✗ Skipped ${example.slug}: ${err.message}`)
        }
      }

      this.emitFile({
        type: 'asset',
        fileName: 'examples/manifest.json',
        source: JSON.stringify(manifest),
      })
    },
  }
}
