export interface GraphNode {
  id: string
  name: string
  val: number
  isAxiomatic: boolean
  category: string
  body: string
  premises: string[]
}

export interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface ExampleEntry {
  slug: string
  name: string
  description: string
}

export const CATEGORY_COLORS: Record<string, string> = {
  mathematics: '#3b82f6',
  physics: '#8b5cf6',
  logic: '#f59e0b',
  philosophy: '#f43f5e',
  computation: '#06b6d4',
  biology: '#10b981',
  linguistics: '#f97316',
  systems: '#ec4899',
  uncategorized: '#6366f1',
}

export interface ViewSettings {
  showLabels: boolean
  autoHideLabels: boolean
  labelScale: number
  nodeScale: number
  linkWidth: number
  showArrows: boolean
  linkCurvature: number
  showParticles: boolean
  repelForce: number
  linkDistance: number
  alphaDecay: number
  velocityDecay: number
  panDuration: number
  zoomDuration: number
}

export const DEFAULT_SETTINGS: ViewSettings = {
  showLabels: true,
  autoHideLabels: true,
  labelScale: 1,
  nodeScale: 1,
  linkWidth: 1,
  showArrows: false,
  linkCurvature: 0,
  showParticles: false,
  repelForce: -100,
  linkDistance: 60,
  alphaDecay: 0.02,
  velocityDecay: 0.3,
  panDuration: 1000,
  zoomDuration: 2000,
}
