import type { GraphNode, GraphData } from '../types'

interface Props {
  node: GraphNode | null
  graphData: GraphData | null
  onClose: () => void
  onSelectNode: (id: string) => void
}

export default function NodePanel({ node, graphData, onClose, onSelectNode }: Props) {
  if (!node || !graphData) return null

  const incoming = graphData.links
    .filter((l) => {
      const t = typeof l.target === 'object' ? (l.target as any).id : l.target
      return t === node.id
    })
    .map((l) => typeof l.source === 'object' ? (l.source as any).id : l.source)

  const outgoing = graphData.links
    .filter((l) => {
      const s = typeof l.source === 'object' ? (l.source as any).id : l.source
      return s === node.id
    })
    .map((l) => typeof l.target === 'object' ? (l.target as any).id : l.target)

  const bodyPreview = node.body.slice(0, 500) + (node.body.length > 500 ? '...' : '')

  return (
    <div className="w-80 shrink-0 border-l border-[var(--border)] bg-[var(--bg-secondary)] p-5 overflow-y-auto">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] leading-tight pr-2">
          {node.name}
        </h2>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xl leading-none cursor-pointer"
        >
          x
        </button>
      </div>

      <div className="text-xs text-[var(--text-muted)] font-mono mb-4">{node.id}.md</div>

      {node.isAxiomatic && (
        <span className="inline-block text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 mb-4">
          Axiomatic
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Content
        </h3>
        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
          {bodyPreview}
        </p>
      </div>

      {incoming.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Premises (incoming)
          </h3>
          <ul className="space-y-1">
            {incoming.map((id) => (
              <li
                key={id}
                onClick={() => onSelectNode(id)}
                className="text-sm text-indigo-400 font-mono cursor-pointer hover:text-indigo-300"
              >
                {id}
              </li>
            ))}
          </ul>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            References (outgoing)
          </h3>
          <ul className="space-y-1">
            {outgoing.map((id) => (
              <li
                key={id}
                onClick={() => onSelectNode(id)}
                className="text-sm text-indigo-400 font-mono cursor-pointer hover:text-indigo-300"
              >
                {id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
