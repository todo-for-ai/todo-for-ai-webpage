import type { CanvasStep } from './canvasModel'

export const NODE_W = 200
export const NODE_H = 64

/** 画布边（由 depends_on 派生） */
export interface CanvasEdge {
  id: string
  from: string
  to: string
  /** 目标步骤带条件时边上标注 */
  conditional: boolean
}

export const deriveEdges = (steps: CanvasStep[]): CanvasEdge[] => {
  const edges: CanvasEdge[] = []
  const seen = new Set<string>()
  for (const s of steps) {
    for (const dep of s.depends_on ?? []) {
      const id = `e-${dep}->${s.step_key}`
      if (seen.has(id)) continue
      seen.add(id)
      edges.push({ id, from: dep, to: s.step_key, conditional: Boolean(s.condition) })
    }
  }
  return edges
}

/** 依赖边：源节点右缘中点 → 目标节点左缘中点的三次贝塞尔 */
export const edgePath = (from: { x: number; y: number }, to: { x: number; y: number }): string => {
  const x1 = from.x + NODE_W
  const y1 = from.y + NODE_H / 2
  const x2 = to.x
  const y2 = to.y + NODE_H / 2
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}

export const edgeMidpoint = (from: { x: number; y: number }, to: { x: number; y: number }) => {
  const x1 = from.x + NODE_W
  const y1 = from.y + NODE_H / 2
  const x2 = to.x
  const y2 = to.y + NODE_H / 2
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
}

export interface ContentBounds {
  minX: number
  minY: number
  width: number
  height: number
}

export const contentBounds = (steps: CanvasStep[]): ContentBounds | null => {
  if (steps.length === 0) return null
  const minX = Math.min(...steps.map(s => s.position.x)) - 40
  const minY = Math.min(...steps.map(s => s.position.y)) - 40
  const maxX = Math.max(...steps.map(s => s.position.x + NODE_W)) + 40
  const maxY = Math.max(...steps.map(s => s.position.y + NODE_H)) + 40
  return { minX, minY, width: Math.max(200, maxX - minX), height: Math.max(160, maxY - minY) }
}

export const ZOOM_MIN = 0.35
export const ZOOM_MAX = 1.6

/** 视口适配：内容包围盒居中放入容器（返回世界坐标层的 transform 参数） */
export const fitTransform = (
  steps: CanvasStep[],
  box: { w: number; h: number },
): { tx: number; ty: number; zoom: number } => {
  const b = contentBounds(steps)
  if (!b || box.w === 0 || box.h === 0) return { tx: 0, ty: 0, zoom: 1 }
  const zoom = Math.min(box.w / b.width, box.h / b.height, 1.25, ZOOM_MAX)
  const tx = (box.w - b.width * zoom) / 2 - b.minX * zoom
  const ty = (box.h - b.height * zoom) / 2 - b.minY * zoom
  return { tx, ty, zoom }
}
