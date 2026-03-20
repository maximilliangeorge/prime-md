import { useState, useMemo, useCallback, useEffect } from 'react'
import GraphView from './components/GraphView'
import NodePanel from './components/NodePanel'
import SettingsPanel from './components/SettingsPanel'
import { buildGraphFromApi } from './lib/graph'
import type { GraphNode, ExampleEntry } from './types'
import type { SerializedGraph } from './server/prime-plugin'
import { DEFAULT_SETTINGS, type ViewSettings, CATEGORY_COLORS } from './types'

const BASE = import.meta.env.BASE_URL

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

function useExamples() {
  const [examples, setExamples] = useState<ExampleEntry[]>([])

  useEffect(() => {
    if (import.meta.env.DEV) {
      fetch('/api/examples')
        .then(res => res.json())
        .then(setExamples)
        .catch(() => {})
    } else {
      fetch(`${BASE}examples/manifest.json`)
        .then(res => res.json())
        .then(setExamples)
        .catch(() => {})
    }
  }, [])

  return examples
}

function useGraph(slug: string | null) {
  const [data, setData] = useState<SerializedGraph | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    setError(null)

    const url = import.meta.env.DEV
      ? `/api/graph?example=${encodeURIComponent(slug)}`
      : `${BASE}examples/${slug}.json`

    fetch(url)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load graph')
        return json as SerializedGraph
      })
      .then((graph) => {
        if (!cancelled) {
          setData(graph)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [slug])

  return { data, error, loading }
}

export default function App() {
  const examples = useExamples()
  const [selectedExample, setSelectedExample] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewSettings, setViewSettings] = useState<ViewSettings>(DEFAULT_SETTINGS)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const { width, height } = useWindowSize()

  // Read example from URL hash, or default to first
  useEffect(() => {
    if (examples.length === 0) return
    if (selectedExample) return
    const hash = window.location.hash.slice(1)
    const match = examples.find(e => e.slug === hash)
    setSelectedExample(match ? match.slug : examples[0].slug)
  }, [examples, selectedExample])

  const { data: apiData, error, loading } = useGraph(selectedExample)

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  const graphData = useMemo(() => {
    if (!apiData) return null
    return buildGraphFromApi(apiData)
  }, [apiData])

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node))
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNode(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleExampleChange = (slug: string) => {
    setSelectedNode(null)
    setSearchQuery('')
    setSelectedExample(slug)
    window.location.hash = slug
  }

  const currentExample = examples.find(e => e.slug === selectedExample)

  const visibleCategories = useMemo(() => {
    if (!graphData) return []
    const cats = new Set(graphData.nodes.map(n => n.category))
    return [...cats].sort()
  }, [graphData])

  const panelWidth = selectedNode ? 320 : 0
  const graphWidth = width - panelWidth

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      <div className="flex-1 relative">
        {/* Example selector & search */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <select
              value={selectedExample ?? ''}
              onChange={(e) => handleExampleChange(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-muted)] w-64 appearance-none cursor-pointer"
            >
              {examples.map((ex) => (
                <option key={ex.slug} value={ex.slug}>
                  {ex.name}
                </option>
              ))}
            </select>
            {currentExample?.description && (
              <span className="text-xs text-[var(--text-faint)] max-w-xs truncate">
                {currentExample.description}
              </span>
            )}
          </div>

          {graphData && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--text-muted)] w-64 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-secondary)] text-sm cursor-pointer p-2"
                >
                  x
                </button>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        {graphData && (
          <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] max-w-md">
            {visibleCategories.map((cat) => (
              <span key={cat} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] || '#6366f1' }}
                />
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Node count, theme toggle & settings */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {graphData && (
            <span className="text-xs text-[var(--text-faint)]">
              {graphData.nodes.length} nodes · {graphData.links.length} edges
            </span>
          )}
          <button
            onClick={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--text-muted)]">
              {theme === 'dark' ? (
                <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
              ) : (
                <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.06 1.06l1.06 1.06Z" />
              )}
            </svg>
          </button>
        </div>
        <SettingsPanel settings={viewSettings} onChange={setViewSettings} />

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-6 w-6 text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-[var(--text-muted)] text-sm">Loading graph...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-red-400 text-sm max-w-md text-center">{error}</span>
          </div>
        )}

        {graphData && (
          <GraphView
            data={graphData}
            selectedNodeId={selectedNode?.id ?? null}
            searchQuery={searchQuery}
            onNodeClick={handleNodeClick}
            onBackgroundClick={() => setSelectedNode(null)}
            width={graphWidth}
            height={height}
            settings={viewSettings}
            theme={theme}
          />
        )}
      </div>

      <NodePanel
        node={selectedNode}
        graphData={graphData}
        onClose={() => setSelectedNode(null)}
        onSelectNode={(id) => {
          const target = graphData?.nodes.find((n) => n.id === id)
          if (target) setSelectedNode(target as GraphNode)
        }}
      />
    </div>
  )
}
