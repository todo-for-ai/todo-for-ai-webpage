// 协作关系图共享的纯渲染助手：kind 配色、声誉环样式、数据过滤与静态布局（可单测）。

export const KIND_COLORS: Record<string, string> = {
  coordinator: '#722ed1', // 紫：协调者
  autonomous: '#13c2c2',  // 青：自主型
  assistant: '#1890ff',   // 蓝：助手型
  external: '#fa8c16',    // 橙：外部
}
export const KIND_COLOR_DEFAULT = '#8c8c8c'
export const kindColor = (kind?: string | null) =>
  (kind && KIND_COLORS[kind]) || KIND_COLOR_DEFAULT
export const kindGradientUrl = (kind?: string | null) =>
  (kind && KIND_COLORS[kind]) ? `url(#cg-grad-${kind})` : 'url(#cg-grad-default)'

// 声誉 0-100 -> 环颜色（红<40 黄40-70 绿>70）
export const reputationColor = (rep?: number | null) => {
  if (rep === null || rep === undefined) return null
  if (rep < 40) return '#ff4d4f'
  if (rep < 70) return '#faad14'
  return '#52c41a'
}
// 声誉 -> 环描边粗细梯度（高声誉更粗，强化视觉权重）
export const reputationStrokeWidth = (rep?: number | null) => {
  if (rep === null || rep === undefined) return 1.5
  if (rep >= 80) return 3.5
  if (rep >= 50) return 2.5
  return 1.5
}

// ── 数据过滤与布局计算（组件内同源逻辑沉淀，可单测）──

export interface LayoutNode {
  id: number
  name?: string
  kind?: string | null
  [k: string]: unknown
}

export interface LayoutEdge {
  source: number
  target: number
  count: number
  [k: string]: unknown
}

export interface FilterOptions {
  filterKinds?: string[]
  minCount?: number
  centerNodeId?: number
}

/** 按 kind 集合与最小消息量过滤节点/边：返回过滤后节点集与边集。 */
export function filterGraphData<T extends { id: number }, E extends { source: number; target: number; count: number }>(
  allNodes: T[],
  allEdges: E[],
  opts: FilterOptions,
): { nodes: T[]; edges: E[] } {
  const kindSet = opts.filterKinds && opts.filterKinds.length > 0 ? new Set(opts.filterKinds) : null
  const kindNodes = kindSet ? allNodes.filter((n) => (n as any).kind && kindSet.has((n as any).kind)) : allNodes
  const kindIds = new Set(kindNodes.map((n) => n.id))
  const minC = opts.minCount && opts.minCount > 0 ? opts.minCount : 0
  const edges = allEdges.filter((e) => {
    if (kindSet && !(kindIds.has(e.source) && kindIds.has(e.target))) return false
    if (minC && e.count < minC) return false
    return true
  })
  const usedIds = new Set<number>()
  edges.forEach((e) => { usedIds.add(e.source); usedIds.add(e.target) })
  if (opts.centerNodeId !== undefined) usedIds.add(opts.centerNodeId)
  const nodes = (kindSet ? kindNodes : allNodes).filter((n) => usedIds.has(n.id))
  return { nodes, edges }
}

/** 静态布局坐标：circular 圆周 / grid 网格（force 由 rAF 实时驱动，不在此计算）。 */
export function computeStaticPositions(
  nodes: Array<{ id: number }>,
  layout: 'circular' | 'grid',
  size: number,
): Map<number, { x: number; y: number }> {
  const pos = new Map<number, { x: number; y: number }>()
  const cx = size / 2
  const cy = size / 2
  if (layout === 'grid') {
    const cols = Math.ceil(Math.sqrt(nodes.length))
    const cell = (size - 40) / Math.max(cols, 1)
    nodes.forEach((n, i) => {
      const row = Math.floor(i / cols)
      const col = i % cols
      pos.set(n.id, { x: 20 + cell * (col + 0.5), y: 20 + cell * (row + 0.5) })
    })
  } else {
    const radius = size / 2 - 40
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
      pos.set(n.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) })
    })
  }
  return pos
}
