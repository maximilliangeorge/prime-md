import { describe, it, expect } from 'vitest'
import * as path from 'node:path'
import { parseNode } from '../src/parse.js'
import { buildGraph } from '../src/graph-builder.js'
import { formatTree, formatDot, formatJson, formatRefs } from '../src/format.js'

const fixtures = path.resolve(__dirname, 'fixtures')

function buildValidTreeGraph() {
  const rootDir = path.join(fixtures, 'valid-tree')
  const files = [
    'thinking-is-self-evident.md',
    'doubt-presupposes-a-doubter.md',
    'cogito.md',
  ]
  const nodes = files.map((f) => parseNode(path.join(rootDir, f), rootDir))
  return buildGraph(nodes)
}

describe('formatTree', () => {
  it('marks axioms with [axiom]', () => {
    const graph = buildValidTreeGraph()
    const output = formatTree(graph, { color: false })
    expect(output).toContain('[axiom]')
  })

  it('lists premises before conclusion with correct connectors', () => {
    const graph = buildValidTreeGraph()
    const output = formatTree(graph, { color: false })
    expect(output).toMatch('├─')
    expect(output).toMatch('└─')
  })
})

describe('formatDot', () => {
  it('produces valid digraph', () => {
    const graph = buildValidTreeGraph()
    const output = formatDot(graph)

    expect(output).toContain('digraph prime {')
    expect(output).toContain('rankdir=BT')
    expect(output).toContain('shape=box') // axioms
    expect(output).toContain('shape=ellipse') // non-axioms
    expect(output).toContain('->') // edges
    expect(output.trim()).toMatch(/}$/) // closes the digraph
  })
})

describe('formatRefs', () => {
  it('outputs one relative path per line for local nodes', () => {
    const graph = buildValidTreeGraph()
    const output = formatRefs(graph)
    const lines = output.split('\n')

    expect(lines).toHaveLength(3)
    expect(lines).toContain('cogito.md')
    expect(lines).toContain('thinking-is-self-evident.md')
    expect(lines).toContain('doubt-presupposes-a-doubter.md')
  })

  it('outputs refs in sorted order', () => {
    const graph = buildValidTreeGraph()
    const output = formatRefs(graph)
    const lines = output.split('\n')

    const sorted = [...lines].sort()
    expect(lines).toEqual(sorted)
  })

  it('outputs GitHub URLs for remote nodes', () => {
    const graph = buildValidTreeGraph()
    const remoteUrl = 'https://github.com/owner/repo/blob/main/axiom.md'
    graph.nodes.set(remoteUrl, {
      filePath: remoteUrl,
      relativePath: 'axiom.md',
      claim: 'Remote axiom',
      body: null,
      premises: [],
      isAxiom: true,
    })

    const output = formatRefs(graph)
    const lines = output.split('\n')

    expect(lines).toContain(remoteUrl)
    expect(lines).toContain('cogito.md')
  })

  it('handles remote nodes with nested paths', () => {
    const graph = buildGraph([])
    const remoteUrl = 'https://github.com/owner/repo/blob/main/dir/nested/claim.md'
    graph.nodes.set(remoteUrl, {
      filePath: remoteUrl,
      relativePath: 'dir/nested/claim.md',
      claim: 'Nested claim',
      body: null,
      premises: [],
      isAxiom: true,
    })

    const output = formatRefs(graph)
    expect(output).toBe(remoteUrl)
  })

  it('returns empty string for empty graph', () => {
    const graph = buildGraph([])
    const output = formatRefs(graph)
    expect(output).toBe('')
  })
})

describe('formatJson', () => {
  it('produces parseable JSON with correct structure', () => {
    const graph = buildValidTreeGraph()
    const output = formatJson(graph)
    const parsed = JSON.parse(output)

    expect(parsed).toHaveProperty('nodes')
    expect(parsed).toHaveProperty('edges')

    // Check nodes
    expect(parsed.nodes['cogito.md']).toBeDefined()
    expect(parsed.nodes['cogito.md'].claim).toBe('I think, therefore I am')
    expect(parsed.nodes['cogito.md'].isAxiom).toBe(false)
    expect(parsed.nodes['cogito.md'].premises).toHaveLength(2)

    expect(parsed.nodes['thinking-is-self-evident.md'].isAxiom).toBe(true)

    // Check edges
    expect(parsed.edges).toHaveLength(2)
    for (const edge of parsed.edges) {
      expect(edge.from).toBe('cogito.md')
    }
  })
})
