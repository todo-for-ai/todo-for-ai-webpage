import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'
import type { CanvasStep } from './canvasModel'

export const NODE_WIDTH = 200
export const NODE_HEIGHT = 64

/** 步骤列表 → React Flow 节点/边（边完全由 depends_on 派生，画布上只作展示与快捷删除） */
export const stepsToFlow = (steps: CanvasStep[]): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = steps.map(s => ({
    id: s.step_key,
    type: 'wfStep',
    position: s.position,
    data: { step: s },
  }))
  const edges: Edge[] = []
  for (const s of steps) {
    for (const dep of s.depends_on ?? []) {
      // 依赖方向：dep → s（依赖先行）。多条重复依赖只画一条
      const id = `e-${dep}-${s.step_key}`
      if (edges.some(e => e.id === id)) continue
      edges.push({
        id,
        source: dep,
        target: s.step_key,
        animated: false,
        style: { stroke: '#69b1ff', strokeWidth: 1.5 },
        label: s.condition ? '条件' : undefined,
        labelStyle: { fontSize: 10, fill: '#8c8c8c' },
      })
    }
  }
  return { nodes, edges }
}

/** dagre 自上而下自动布局（新建/未带坐标的工作流初始排版） */
export const autoLayout = (steps: CanvasStep[]): CanvasStep[] => {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80, marginx: 40, marginy: 40 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const s of steps) g.setNode(s.step_key, { width: NODE_WIDTH, height: NODE_HEIGHT })
  for (const s of steps) for (const dep of s.depends_on ?? []) g.setEdge(dep, s.step_key)
  dagre.layout(g)
  return steps.map(s => {
    const pos = g.node(s.step_key)
    return {
      ...s,
      position: {
        x: Math.round((pos?.x ?? s.position.x) - NODE_WIDTH / 2),
        y: Math.round((pos?.y ?? s.position.y) - NODE_HEIGHT / 2),
      },
    }
  })
}

/** 连线 = 给 target 的 depends_on 增加一条来源依赖 */
export const applyConnect = (
  steps: CanvasStep[],
  source: string,
  target: string,
): CanvasStep[] => {
  if (source === target) return steps
  // 拒绝成环：target 可达 source 时，新边会构成环
  if (reachable(steps, target, source)) return steps
  return steps.map(s => {
    if (s.step_key !== target) return s
    const deps = s.depends_on ?? []
    if (deps.includes(source)) return s
    return { ...s, depends_on: [...deps, source] }
  })
}

/** 删除边 = 从 target 的 depends_on 移除 */
export const applyDisconnect = (steps: CanvasStep[], source: string, target: string): CanvasStep[] =>
  steps.map(s =>
    s.step_key === target
      ? { ...s, depends_on: (s.depends_on ?? []).filter(d => d !== source) }
      : s,
  )

const reachable = (steps: CanvasStep[], from: string, to: string): boolean => {
  const byKey = new Map(steps.map(s => [s.step_key, s]))
  const seen = new Set<string>()
  const stack = [from]
  while (stack.length) {
    const cur = stack.pop() as string
    if (cur === to) return true
    if (seen.has(cur)) continue
    seen.add(cur)
    const node = byKey.get(cur)
    for (const dep of node?.depends_on ?? []) stack.push(dep)
  }
  return false
}
