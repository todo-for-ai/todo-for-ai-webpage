import { useCallback, useEffect, useRef, useState } from 'react'

interface ForceNode {
  id: number
}

interface ForceEdge {
  source: number
  target: number
  count?: number
}

interface ForceCoords {
  x: number
  y: number
  vx: number
  vy: number
}

/**
 * 力导向布局实时坐标：rAF 逐步收敛（斥力 + 边吸引力 + 中心引力 + 阻尼），
 * 让用户看到布局过程。由 CollaborationGraphView 原样拆出（参数与算法不变）。
 */
export function useForceSimulation(opts: {
  layout: 'circular' | 'grid' | 'force'
  size: number
  cx: number
  cy: number
  forceRepulsion: number
  forceLinkDistance: number
  nodes: ForceNode[]
  edges: ForceEdge[]
}) {
  const { layout, size, cx, cy, forceRepulsion, forceLinkDistance, nodes, edges } = opts

  const initialForceCoords = (): Map<number, ForceCoords> => {
    const m = new Map<number, ForceCoords>()
    const radius = size / 2 - 40
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1) - Math.PI / 2
      m.set(n.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), vx: 0, vy: 0 })
    })
    return m
  }
  const [forceCoords, setForceCoords] = useState<Map<number, ForceCoords>>(initialForceCoords)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (layout !== 'force') return
    // 重置为圆周起点，重新收敛
    let coords = initialForceCoords()
    setForceCoords(new Map(coords))
    const k = size / 10
    const repulsion = Math.max(0, forceRepulsion)
    const linkK = Math.max(1, k * Math.max(0, forceLinkDistance))
    const idxList = nodes.map((n) => n.id)
    const edgeList = edges.map((e) => ({ source: e.source, target: e.target, count: e.count }))
    const maxFrames = 180
    let frame = 0
    const tick = () => {
      frame++
      // 斥力
      for (let i = 0; i < idxList.length; i++) {
        for (let j = i + 1; j < idxList.length; j++) {
          const a = coords.get(idxList[i])!
          const b = coords.get(idxList[j])!
          let dx = a.x - b.x
          let dy = a.y - b.y
          let d = Math.hypot(dx, dy)
          if (d < 1) { d = 1; dx = (i % 3) - 1; dy = (j % 3) - 1 }
          const f = ((k * k) / (d * d)) * repulsion
          const ux = dx / d
          const uy = dy / d
          a.vx += ux * f; a.vy += uy * f
          b.vx -= ux * f; b.vy -= uy * f
        }
      }
      // 吸引力（边）
      edgeList.forEach((e) => {
        const a = coords.get(e.source); const b = coords.get(e.target)
        if (!a || !b) return
        const dx = b.x - a.x; const dy = b.y - a.y
        const d = Math.max(1, Math.hypot(dx, dy))
        const f = (d * d) / linkK
        const ux = dx / d; const uy = dy / d
        a.vx += ux * f; a.vy += uy * f
        b.vx -= ux * f; b.vy -= uy * f
      })
      // 应用速度 + 中心引力 + 阻尼
      const damping = 0.85
      coords.forEach((c) => {
        c.vx = (c.vx + (cx - c.x) * 0.01) * damping
        c.vy = (c.vy + (cy - c.y) * 0.01) * damping
        c.x += Math.max(-12, Math.min(12, c.vx))
        c.y += Math.max(-12, Math.min(12, c.vy))
      })
      setForceCoords(new Map(coords))
      if (frame < maxFrames) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, size, forceRepulsion, forceLinkDistance, nodes.map((n) => n.id).join(','), edges.map((e) => `${e.source}-${e.target}-${e.count}`).join(',')])

  return { forceCoords, setForceCoords, rafRef }
}
