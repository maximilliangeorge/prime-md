import { useCallback, useRef, useMemo, useEffect } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { GraphData, GraphNode, ViewSettings } from '../types'
import { CATEGORY_COLORS } from '../types'

interface Props {
  data: GraphData
  selectedNodeId: string | null
  searchQuery: string
  onNodeClick: (node: GraphNode) => void
  onBackgroundClick: () => void
  width: number
  height: number
  settings: ViewSettings
  theme: 'dark' | 'light'
}

const DEFAULT_NODE_COLOR = '#6366f1'
const HIGHLIGHT_COLOR = '#f472b6'
const DIMMED_ALPHA = 0.15

export default function GraphView({
  data,
  selectedNodeId,
  searchQuery,
  onNodeClick,
  onBackgroundClick,
  width,
  height,
  settings,
  theme,
}: Props) {
  const isDark = theme === 'dark'
  const graphBg = isDark ? '#0a0a0f' : '#f5f5f7'
  const labelRgb = isDark ? '255,255,255' : '0,0,0'
  const linkColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
  const linkHighlightColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'
  const fgRef = useRef<any>(null)
  const prevSelectedRef = useRef<string | null>(null)

  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    fg.d3Force('charge')?.strength(settings.repelForce)
    fg.d3Force('link')?.distance(settings.linkDistance)
    fg.d3ReheatSimulation()
  }, [settings.repelForce, settings.linkDistance])

  const connectedNodes = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const set = new Set<string>()
    set.add(selectedNodeId)
    for (const link of data.links) {
      const s = typeof link.source === 'object' ? (link.source as any).id : link.source
      const t = typeof link.target === 'object' ? (link.target as any).id : link.target
      if (s === selectedNodeId) set.add(t)
      if (t === selectedNodeId) set.add(s)
    }
    return set
  }, [selectedNodeId, data.links])

  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    const prev = prevSelectedRef.current
    prevSelectedRef.current = selectedNodeId

    if (prev === null && selectedNodeId === null) return

    if (selectedNodeId) {
      const nodes = data.nodes.filter((n: any) => connectedNodes.has(n.id)) as (GraphNode & { x: number; y: number })[]
      if (nodes.length === 0) return
      const xs = nodes.map((n) => n.x)
      const ys = nodes.map((n) => n.y)
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2
      const spanX = Math.max(...xs) - Math.min(...xs) + 160
      const spanY = Math.max(...ys) - Math.min(...ys) + 160
      const scale = Math.min(width / spanX, height / spanY, 8)
      fg.centerAt(cx, cy, settings.panDuration)
      fg.zoom(scale, settings.zoomDuration)
    } else {
      const nodes = data.nodes as (GraphNode & { x: number; y: number })[]
      if (nodes.length === 0) return
      const xs = nodes.map((n) => n.x)
      const ys = nodes.map((n) => n.y)
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2
      const spanX = Math.max(...xs) - Math.min(...xs) + 80
      const spanY = Math.max(...ys) - Math.min(...ys) + 80
      const scale = Math.min(width / spanX, height / spanY)
      fg.centerAt(cx, cy, settings.panDuration)
      fg.zoom(scale, settings.zoomDuration)
    }
  }, [selectedNodeId, connectedNodes, data.nodes, width, height, settings.panDuration, settings.zoomDuration])

  const matchesSearch = useCallback(
    (node: GraphNode) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return node.name.toLowerCase().includes(q) || node.id.toLowerCase().includes(q)
    },
    [searchQuery]
  )

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const gNode = node as GraphNode & { x: number; y: number }
      const label = gNode.name
      const fontSize = Math.max(12 / globalScale, 1.5) * settings.labelScale
      const r = Math.sqrt(gNode.val) * 3 * settings.nodeScale

      const isSelected = gNode.id === selectedNodeId
      const isConnected = connectedNodes.has(gNode.id)
      const isSearchMatch = matchesSearch(gNode)

      let alpha = 1
      if (selectedNodeId && !isConnected) alpha = DIMMED_ALPHA
      if (searchQuery && !isSearchMatch) alpha = DIMMED_ALPHA

      ctx.globalAlpha = alpha

      if (isSelected || (searchQuery && isSearchMatch)) {
        ctx.beginPath()
        ctx.arc(gNode.x, gNode.y, r + 3, 0, 2 * Math.PI)
        ctx.fillStyle = HIGHLIGHT_COLOR + '60'
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(gNode.x, gNode.y, r, 0, 2 * Math.PI)
      ctx.fillStyle = CATEGORY_COLORS[gNode.category] || DEFAULT_NODE_COLOR
      ctx.fill()

      const forceShow = (selectedNodeId && isConnected) || (searchQuery && isSearchMatch)
      let labelAlpha = 1
      if (!forceShow && settings.autoHideLabels) {
        labelAlpha = Math.max(0, Math.min(1, (globalScale - 1.5) / 0.5))
      }

      if (settings.showLabels && labelAlpha > 0) {
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = `rgba(${labelRgb},${alpha * labelAlpha})`
        ctx.fillText(label, gNode.x, gNode.y + r + 2)
      }

      ctx.globalAlpha = 1
    },
    [selectedNodeId, connectedNodes, searchQuery, matchesSearch, settings.showLabels, settings.autoHideLabels, settings.labelScale, settings.nodeScale, labelRgb]
  )

  const linkColorFn = useCallback(
    (link: any) => {
      const sourceNode = typeof link.source === 'object' ? link.source : null
      const s = sourceNode ? sourceNode.id : link.source
      const t = typeof link.target === 'object' ? link.target.id : link.target

      if (selectedNodeId) {
        if (s === selectedNodeId || t === selectedNodeId) return linkHighlightColor
        return linkColor
      }

      const category = sourceNode?.category
      if (category && CATEGORY_COLORS[category]) {
        return CATEGORY_COLORS[category] + '40'
      }
      return linkColor
    },
    [selectedNodeId, linkColor, linkHighlightColor]
  )

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={data}
      width={width}
      height={height}
      backgroundColor={graphBg}
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={(node: any, color, ctx) => {
        const r = Math.sqrt((node as GraphNode).val) * 3 * settings.nodeScale + 4
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
      }}
      linkColor={linkColorFn}
      linkWidth={settings.linkWidth}
      linkCurvature={settings.linkCurvature}
      linkDirectionalArrowLength={settings.showArrows ? 6 : 0}
      linkDirectionalArrowRelPos={1}
      linkDirectionalParticles={settings.showParticles ? 2 : 0}
      linkDirectionalParticleSpeed={0.005}
      onNodeClick={(node) => onNodeClick(node as GraphNode)}
      onBackgroundClick={onBackgroundClick}
      linkVisibility={true}
      d3AlphaDecay={settings.alphaDecay}
      d3VelocityDecay={settings.velocityDecay}
    />
  )
}
