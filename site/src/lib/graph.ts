import type { GraphData, GraphNode, GraphLink } from '../types'
import type { SerializedGraph } from '../server/prime-plugin'

export function buildGraphFromApi(data: SerializedGraph): GraphData {
  const connectionCount = new Map<string, number>()

  const links: GraphLink[] = []
  for (const edge of data.edges) {
    links.push({ source: edge.source, target: edge.target })
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1)
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1)
  }

  const nodes: GraphNode[] = data.nodes.map((node) => ({
    id: node.id,
    name: node.name,
    val: 1 + (connectionCount.get(node.id) ?? 0),
    isAxiomatic: node.isAxiom,
    category: node.category,
    body: node.body,
    premises: node.premises,
  }))

  return { nodes, links }
}
