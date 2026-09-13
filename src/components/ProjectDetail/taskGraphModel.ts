import { MarkerType, type Edge, type Node } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import type { TaskGraphData, TaskGraphEdge, TaskGraphNode } from '../../api/taskGraph'

// 布局常量（px）
export const NODE_W = 224
export const NODE_H = 56

// 就绪态色板（蓝/绿/橙/灰，与派发依赖门语义一致；禁紫色，圆角 ≤8）
export const READINESS_STYLE: Record<TaskGraphNode['readiness'], { border: string; bg: string; text: string }> = {
  ready: { border: '#0958d9', bg: '#e6f4ff', text: '#0958d9' },
  blocked: { border: '#d46b08', bg: '#fff7e6', text: '#d46b08' },
  done: { border: '#389e0d', bg: '#f6ffed', text: '#389e0d' },
  cancelled: { border: '#8c8c8c', bg: '#fafafa', text: '#595959' },
}
export const CYCLE_COLOR = '#cf1322'
export const EDGE_COLOR = '#b8bfc9'
export const EDGE_DONE_COLOR = '#69b389'
export const CHAIN_COLOR = '#0958d9'

export type ReadinessKey = TaskGraphNode['readiness']
export type ReadinessFilter = Set<ReadinessKey>

export type TaskNodeData = {
  title: string
  readiness: ReadinessKey
  inCycle: boolean
  idLabel: string
  dimmed: boolean
  selected: boolean
  agentCount: number
} & Record<string, unknown>

export type TaskFlowNode = Node<TaskNodeData, 'taskNode'>

/** 任务节点里 type=agent 的指派（带 id 的才可联动跳转；name 缺失回退 #id）。 */
export function agentAssigneesOf(node: TaskGraphNode): Array<{ id: number; name: string }> {
  return (node.assignees || [])
    .filter(
      (a): a is { type: 'agent'; id: number; name?: string } =>
        typeof a === 'object' && a !== null && (a as { type?: unknown }).type === 'agent' && typeof (a as { id?: unknown }).id === 'number',
    )
    .map((a) => ({ id: a.id, name: a.name || `#${a.id}` }))
}

/**
 * 依赖链聚焦：从 rootId 出发计算传递上游（所有前置）与传递下游（所有依赖方）。
 * 边方向 blocker → task：上游 = 逆边走，下游 = 顺边走。环与跨项目边天然被 visited 挡住。
 */
export function collectChains(
  nodes: TaskGraphNode[],
  edges: TaskGraphEdge[],
  rootId: number,
): { upstream: Set<number>; downstream: Set<number> } {
  const idSet = new Set(nodes.map((n) => n.id))
  const blockersOf = new Map<number, number[]>()
  const dependentsOf = new Map<number, number[]>()
  edges.forEach((e) => {
    if (!idSet.has(e.from) || !idSet.has(e.to) || e.from === e.to) return
    if (!dependentsOf.has(e.from)) dependentsOf.set(e.from, [])
    dependentsOf.get(e.from)!.push(e.to)
    if (!blockersOf.has(e.to)) blockersOf.set(e.to, [])
    blockersOf.get(e.to)!.push(e.from)
  })

  const walk = (start: number, nextOf: Map<number, number[]>): Set<number> => {
    const seen = new Set<number>()
    const frontier = [start]
    while (frontier.length) {
      const current = frontier.pop()!
      for (const nxt of nextOf.get(current) || []) {
        if (seen.has(nxt)) continue
        seen.add(nxt)
        frontier.push(nxt)
      }
    }
    return seen
  }

  return {
    upstream: walk(rootId, blockersOf),
    downstream: walk(rootId, dependentsOf),
  }
}

/** 聚焦集合 = 选中节点 + 传递上下游。 */
export function focusSetOf(rootId: number, chains: { upstream: Set<number>; downstream: Set<number> }): Set<number> {
  return new Set([rootId, ...chains.upstream, ...chains.downstream])
}

/** 节点是否应被淡化：优先级 聚焦选择 > 就绪态筛选 > 不淡化。 */
export function isNodeDimmed(
  nodeId: number,
  opts: { selectedId: number | null; focus: Set<number> | null; filter: ReadinessFilter | null; node?: TaskGraphNode },
): boolean {
  if (opts.selectedId != null && opts.focus) return !opts.focus.has(nodeId)
  if (opts.filter && opts.filter.size > 0) {
    return opts.node ? !opts.filter.has(opts.node.readiness) : false
  }
  return false
}

/**
 * dagre LR 自动分层布局 + 联动视觉态：blocker 在左、下游在右。
 * 选中节点时依赖链全亮、链上边蓝色动画、其余淡出；筛选激活时未命中就绪态淡出。
 * dagre 1.x 的 setEdge 必须显式给 label 对象（缺 label 时 layout 写 points 崩溃）。
 */
export function buildFlow(
  graph: TaskGraphData,
  opts: { cycleIds: Set<number>; selectedId?: number | null; focus?: Set<number> | null; filter?: ReadinessFilter | null },
): { nodes: TaskFlowNode[]; edges: Edge[] } {
  const idSet = new Set(graph.nodes.map((n) => n.id))
  const inProjectEdges = graph.edges.filter((e) => idSet.has(e.from) && idSet.has(e.to))
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]))

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 42, ranksep: 120, marginx: 28, marginy: 28 })
  graph.nodes.forEach((n) => g.setNode(String(n.id), { width: NODE_W, height: NODE_H }))
  inProjectEdges.forEach((e) => g.setEdge(String(e.from), String(e.to), {}))
  dagre.layout(g)

  const selectedId = opts.selectedId ?? null
  const focus = selectedId != null ? (opts.focus ?? null) : null
  const filter = opts.filter && opts.filter.size > 0 ? opts.filter : null

  const nodes: TaskFlowNode[] = graph.nodes.map((n) => {
    const pos = g.node(String(n.id))
    const dimmed = isNodeDimmed(n.id, { selectedId, focus, filter, node: n })
    return {
      id: String(n.id),
      type: 'taskNode' as const,
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      draggable: false,
      data: {
        title: n.title,
        readiness: n.readiness,
        inCycle: opts.cycleIds.has(n.id),
        idLabel: `#${n.id}`,
        dimmed,
        selected: selectedId === n.id,
        agentCount: agentAssigneesOf(n).length,
      },
    }
  })

  const readinessById = new Map(graph.nodes.map((n) => [n.id, n.readiness]))
  const edges: Edge[] = inProjectEdges.map((e, i) => {
    const isCycle = opts.cycleIds.has(e.from) && opts.cycleIds.has(e.to)
    const sourceDone = readinessById.get(e.from) === 'done'
    const onChain = !!focus && focus.has(e.from) && focus.has(e.to)
    const dimmed = (!!focus && !onChain) || (!focus && !!filter && !(filter.has(readinessById.get(e.from)!) && filter.has(readinessById.get(e.to)!)))
    const color = isCycle ? CYCLE_COLOR : onChain ? CHAIN_COLOR : sourceDone ? EDGE_DONE_COLOR : EDGE_COLOR
    return {
      id: `e-${e.from}-${e.to}-${i}`,
      source: String(e.from),
      target: String(e.to),
      type: 'smoothstep',
      animated: isCycle || sourceDone || onChain,
      style: { stroke: color, strokeWidth: isCycle || onChain ? 2.2 : 1.6, opacity: dimmed ? 0.12 : 1 },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    }
  })
  return { nodes, edges }
}

/** 统计条分段：按 done → ready → blocked → cancelled 顺序输出非零段。 */
export function progressSegments(stats: TaskGraphData['stats']): Array<{ key: ReadinessKey; count: number }> {
  return ([
    ['done', stats.done],
    ['ready', stats.ready],
    ['blocked', stats.blocked],
    ['cancelled', stats.cancelled],
  ] as Array<[ReadinessKey, number]>)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key, count }))
}
