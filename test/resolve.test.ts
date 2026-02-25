import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { parseNode } from '../src/parse.js'
import { resolveAllPremises } from '../src/resolve.js'
import type { PrimeManifest } from '../src/types.js'

// Mock the cache module so we don't actually clone repos
vi.mock('../src/cache.js', () => ({
  ensureCached: vi.fn().mockResolvedValue('/fake/cache'),
  readCachedFile: vi.fn(),
}))

import { readCachedFile } from '../src/cache.js'

const fixtures = path.resolve(__dirname, 'fixtures')
const remoteFixtures = path.join(fixtures, 'remote-sim')
const emptyManifest: PrimeManifest = { remotes: {}, exports: [] }

function readFixture(name: string): string {
  return fs.readFileSync(path.join(remoteFixtures, name), 'utf-8')
}

beforeEach(() => {
  vi.mocked(readCachedFile).mockReset()
})

describe('resolveAllPremises', () => {
  it('returns remote nodes for resolved premises', async () => {
    vi.mocked(readCachedFile).mockResolvedValue(readFixture('axiom-a.md'))

    const nodes = [
      parseNode(
        path.join(remoteFixtures, 'root-with-remote.md'),
        remoteFixtures,
      ),
    ]

    const remoteNodes = await resolveAllPremises(
      nodes,
      remoteFixtures,
      emptyManifest,
    )

    expect(remoteNodes).toHaveLength(1)
    expect(remoteNodes[0].claim).toBe('Remote axiom A')
    expect(remoteNodes[0].isAxiom).toBe(true)
    expect(remoteNodes[0].filePath).toContain('prime://')
  })

  it('sets resolvedPath on the premise to canonical URI', async () => {
    vi.mocked(readCachedFile).mockResolvedValue(readFixture('axiom-a.md'))

    const nodes = [
      parseNode(
        path.join(remoteFixtures, 'root-with-remote.md'),
        remoteFixtures,
      ),
    ]

    await resolveAllPremises(nodes, remoteFixtures, emptyManifest)

    const remotePremise = nodes[0].premises[0]
    expect(remotePremise.resolvedPath).toBe(
      'prime://github.com/test/repo/main/axiom-a.md',
    )
    expect(remotePremise.error).toBeUndefined()
  })

  it('recursively resolves local premises within a remote repo', async () => {
    // First call: fetch derived-b.md (which has a local premise ./axiom-a.md)
    // Second call: fetch axiom-a.md (the transitive dependency)
    vi.mocked(readCachedFile)
      .mockResolvedValueOnce(readFixture('derived-b.md'))
      .mockResolvedValueOnce(readFixture('axiom-a.md'))

    const node = parseNode(
      path.join(remoteFixtures, 'root-with-remote.md'),
      remoteFixtures,
    )
    // Override the premise to point to derived-b.md instead
    node.premises[0].raw = 'prime://github.com/test/repo/main/derived-b.md'

    const remoteNodes = await resolveAllPremises(
      [node],
      remoteFixtures,
      emptyManifest,
    )

    // Should have 2 remote nodes: derived-b and axiom-a
    expect(remoteNodes).toHaveLength(2)
    const claims = remoteNodes.map((n) => n.claim).sort()
    expect(claims).toContain('Derived claim B')
    expect(claims).toContain('Remote axiom A')
  })

  it('does not re-fetch visited URIs (prevents infinite loops)', async () => {
    vi.mocked(readCachedFile).mockResolvedValue(readFixture('axiom-a.md'))

    const node = parseNode(
      path.join(remoteFixtures, 'root-with-remote.md'),
      remoteFixtures,
    )
    // Add a duplicate premise
    node.premises.push({
      kind: 'remote',
      raw: 'prime://github.com/test/repo/main/axiom-a.md',
      resolvedPath: null,
    })

    const remoteNodes = await resolveAllPremises(
      [node],
      remoteFixtures,
      emptyManifest,
    )

    // Only one remote node despite two premises pointing to same URI
    expect(remoteNodes).toHaveLength(1)
    expect(readCachedFile).toHaveBeenCalledTimes(1)
  })

  it('respects maxDepth=0 (no recursive following)', async () => {
    vi.mocked(readCachedFile).mockResolvedValue(readFixture('derived-b.md'))

    const node = parseNode(
      path.join(remoteFixtures, 'root-with-remote.md'),
      remoteFixtures,
    )
    node.premises[0].raw = 'prime://github.com/test/repo/main/derived-b.md'

    const remoteNodes = await resolveAllPremises(
      [node],
      remoteFixtures,
      emptyManifest,
      0,
    )

    // maxDepth=0 means don't fetch at all beyond setting resolvedPath
    // Actually depth 0 means: resolve the first level but don't follow their deps
    // The premise gets resolved but derived-b's own local premise is not followed
    // Only derived-b is fetched, not axiom-a
    expect(remoteNodes).toHaveLength(1)
    expect(remoteNodes[0].claim).toBe('Derived claim B')
  })

  it('sets error on invalid URI', async () => {
    const node = parseNode(
      path.join(remoteFixtures, 'root-with-remote.md'),
      remoteFixtures,
    )
    node.premises[0].raw = 'prime://invalid'

    const remoteNodes = await resolveAllPremises(
      [node],
      remoteFixtures,
      emptyManifest,
    )

    expect(remoteNodes).toHaveLength(0)
    expect(node.premises[0].error).toContain('Invalid prime URI')
  })

  it('sets error when remote file not found', async () => {
    vi.mocked(readCachedFile).mockResolvedValue(null)

    const nodes = [
      parseNode(
        path.join(remoteFixtures, 'root-with-remote.md'),
        remoteFixtures,
      ),
    ]

    const remoteNodes = await resolveAllPremises(
      nodes,
      remoteFixtures,
      emptyManifest,
    )

    expect(remoteNodes).toHaveLength(0)
    expect(nodes[0].premises[0].error).toContain('Remote file not found')
  })
})
