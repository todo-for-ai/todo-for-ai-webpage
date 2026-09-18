import dagre from '@dagrejs/dagre'
import type { CanvasStep } from './canvasModel'

export const NODE_WIDTH = 200
export const NODE_HEIGHT = 64

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
