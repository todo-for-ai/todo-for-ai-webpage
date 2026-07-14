import React from 'react'
import { useState, useMemo, useRef, useEffect } from 'react'
import { Empty, Typography } from 'antd'
import type { CollaborationGraph as GraphData } from '../api/agents'

const { Text } = Typography

// Agent kind -> 颜色映射，用于按类型着色分组
const KIND_COLORS: Record<string, string> = {
  coordinator: '#722ed1', // 紫：协调者
  autonomous: '#13c2c2',  // 青：自主型
  assistant: '#1890ff',   // 蓝：助手型
  external: '#fa8c16',    // 橙：外部
}
const KIND_COLOR_DEFAULT = '#8c8c8c'
const kindColor = (kind?: string | null) =>
  (kind && KIND_COLORS[kind]) || KIND_COLOR_DEFAULT
const kindGradientUrl = (kind?: string | null) =>
  (kind && KIND_COLORS[kind]) ? `url(#cg-grad-${kind})` : 'url(#cg-grad-default)'

// 声誉 0-100 -> 环颜色（红<40 黄40-70 绿>70）
const reputationColor = (rep?: number | null) => {
  if (rep === null || rep === undefined) return null
  if (rep < 40) return '#ff4d4f'
  if (rep < 70) return '#faad14'
  return '#52c41a'
}
// 声誉 -> 环描边粗细梯度（高声誉更粗，强化视觉权重）
const reputationStrokeWidth = (rep?: number | null) => {
  if (rep === null || rep === undefined) return 1.5
  if (rep >= 80) return 3.5
  if (rep >= 50) return 2.5
  return 1.5
}

interface CollaborationGraphViewProps {
  /** 图数据：nodes + edges */
  data: GraphData | null
  /** 画布宽度/高度（正方形，默认 360） */
  size?: number
  /** 布局：circular 环形（默认）| grid 网格 | force 力导向 */
  layout?: 'circular' | 'grid' | 'force'
  /** 中心节点 ID：该节点用加粗描边+更大半径突出（用于 Agent 详情子图） */
  centerNodeId?: number
  /** 仅显示这些 kind 的节点及其互连边（为空/未传则显示全部） */
  filterKinds?: string[]
  /** 搜索词：匹配 name 的节点保持高亮，其余节点变淡（不改变布局） */
  searchTerm?: string
  /** 最小消息量阈值：count 低于此值的边隐藏（孤立节点随之隐藏） */
  minCount?: number
  /** 边中点常显消息数标签（默认仅 hover tooltip） */
  showEdgeLabels?: boolean
  /** 点击节点回调 */
  onNodeClick?: (agentId: number) => void
  /** localStorage 持久化键：传入则节点拖拽位置按此键记忆，跨会话恢复 */
  storageKey?: string
  /** 力导向斥力强度倍数（默认 1，越大节点越分散），仅 force 布局生效 */
  forceRepulsion?: number
  /** 力导向理想链接距离倍数（默认 1，越大边越长），仅 force 布局生效 */
  forceLinkDistance?: number
}

/**
 * Agent 协作关系图（纯 SVG）。
 *
 * circular 布局：节点均匀分布在圆周上；grid 布局：节点按行列网格排列。
 * 节点按 messages 缩放半径；边为弦，按 count 缩放粗细与透明度。
 * 节点 hover 高亮其邻居。centerNodeId 指定的节点加粗描边突出。无第三方依赖。
 */
const CollaborationGraphView = React.forwardRef<SVGSVGElement, CollaborationGraphViewProps>(({
  data,
  size = 360,
  layout = 'circular',
  centerNodeId,
  filterKinds,
  searchTerm,
  minCount,
  showEdgeLabels,
  onNodeClick,
  storageKey,
  forceRepulsion = 1,
  forceLinkDistance = 1,
}, ref) => {
  const allNodes = data?.nodes || []
  const allEdges = data?.edges || []
  // 按 kind 过滤：仅保留选中 kind 的节点，边两端都必须在过滤集内
  const kindSet = filterKinds && filterKinds.length > 0 ? new Set(filterKinds) : null
  const kindNodes = kindSet ? allNodes.filter((n) => n.kind && kindSet.has(n.kind)) : allNodes
  const kindIds = new Set(kindNodes.map((n) => n.id))
  // 按最小消息量过滤边：count 低于 minCount 的边剔除
  const minC = minCount && minCount > 0 ? minCount : 0
  const filteredEdges = allEdges.filter((e) => {
    if (kindSet && !(kindIds.has(e.source) && kindIds.has(e.target))) return false
    if (minC && e.count < minC) return false
    return true
  })
  // 仅保留出现在过滤后边中的节点（剔除因边过滤而孤立的节点），中心节点始终保留
  const usedIds = new Set<number>()
  filteredEdges.forEach((e) => { usedIds.add(e.source); usedIds.add(e.target) })
  if (centerNodeId !== undefined) usedIds.add(centerNodeId)
  const nodes = (kindSet ? kindNodes : allNodes).filter((n) => usedIds.has(n.id))
  const edges = filteredEdges
  const cx = size / 2
  const cy = size / 2
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<{ source: number; target: number } | null>(null)
  // 拖拽：节点位置覆盖（用户手动调整），可选从 localStorage 恢复
  const loadPersisted = (): Record<number, { x: number; y: number }> => {
    if (!storageKey) return {}
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        const out: Record<number, { x: number; y: number }> = {}
        for (const k of Object.keys(parsed)) {
          const v = parsed[k]
          if (v && typeof v.x === 'number' && typeof v.y === 'number') {
            out[Number(k)] = { x: v.x, y: v.y }
          }
        }
        return out
      }
    } catch {
      // ignore malformed storage
    }
    return {}
  }
  const [dragOverride, setDragOverride] = useState<Record<number, { x: number; y: number }>>(loadPersisted)
  const storageKeyRef = useRef(storageKey)
  storageKeyRef.current = storageKey
  const draggingRef = useRef<number | null>(null)
  const dragMovedRef = useRef(false)
  const svgWrapRef = useRef<HTMLDivElement | null>(null)
  // 缩放与平移
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const panningRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null)

  // 力导向布局实时坐标（rAF 逐步收敛，让用户看到布局过程）
  const initialForceCoords = (): Map<number, { x: number; y: number; vx: number; vy: number }> => {
    const m = new Map<number, { x: number; y: number; vx: number; vy: number }>()
    const radius = size / 2 - 40
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1) - Math.PI / 2
      m.set(n.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), vx: 0, vy: 0 })
    })
    return m
  }
  const [forceCoords, setForceCoords] = useState<Map<number, { x: number; y: number; vx: number; vy: number }>>(initialForceCoords)
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
    const edgeList = edges.map((e) => ({ source: e.source, target: e.target }))
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
  }, [layout, size, cx, cy, forceRepulsion, forceLinkDistance, nodes.map((n) => n.id).join(','), edges.map((e) => `${e.source}-${e.target}-${e.count}`).join(',')])

  if (nodes.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无协作关系数据" style={{ margin: '8px 0' }} />
  }

  const maxMsg = Math.max(1, ...nodes.map((n) => n.messages))
  const maxCount = Math.max(1, ...edges.map((e) => e.count))

  // 节点位置
  const nodePos = useMemo(() => {
    const pos = new Map<number, { x: number; y: number }>()
    if (layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(nodes.length))
      const cell = (size - 40) / Math.max(cols, 1)
      nodes.forEach((n, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        pos.set(n.id, { x: 20 + cell * (col + 0.5), y: 20 + cell * (row + 0.5) })
      })
    } else if (layout === 'force') {
      // 力导向位置由 rAF 效果实时更新到 forceCoords，这里直接读取当前帧
      forceCoords.forEach((c, id) => pos.set(id, { x: c.x, y: c.y }))
    } else {
      const radius = size / 2 - 40 // 留出标签空间
      nodes.forEach((n, i) => {
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
        pos.set(n.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) })
      })
    }
    return pos
  }, [nodes, edges, layout, size, cx, cy, forceCoords])

  // 取节点位置：优先拖拽覆盖
  const getPos = (id: number) => dragOverride[id] || nodePos.get(id) || { x: 0, y: 0 }

  // 拖拽：将鼠标客户端坐标转为 svg 内坐标
  const svgPoint = (clientX: number, clientY: number) => {
    const svg = svgWrapRef.current?.querySelector('svg')
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }
  const onNodeDragStart = (id: number) => {
    draggingRef.current = id
    dragMovedRef.current = false
    setIsDragging(true)
  }
  const onSvgMouseMove = (e: React.MouseEvent) => {
    if (draggingRef.current !== null) {
      dragMovedRef.current = true
      const p = svgPoint(e.clientX, e.clientY)
      setDragOverride((prev) => ({ ...prev, [draggingRef.current as number]: { x: p.x, y: p.y } }))
      return
    }
    if (panningRef.current) {
      setPan({
        x: panningRef.current.panX + (e.clientX - panningRef.current.startX),
        y: panningRef.current.panY + (e.clientY - panningRef.current.startY),
      })
    }
  }
  const onSvgMouseUp = () => {
    const wasNodeDrag = dragMovedRef.current && draggingRef.current !== null
    draggingRef.current = null
    panningRef.current = null
    setIsDragging(false)
    if (wasNodeDrag && storageKeyRef.current) {
      try {
        localStorage.setItem(storageKeyRef.current, JSON.stringify(dragOverride))
      } catch {
        // storage may be unavailable (private mode / quota)
      }
    }
  }
  // 滚轮缩放
  const onSvgWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    setZoom((z) => Math.max(0.3, Math.min(3, z * factor)))
  }
  // 背景拖拽平移（非节点时）
  const onBgMouseDown = (e: React.MouseEvent) => {
    panningRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }

  // 节点半径按消息量分四档梯度（低/中低/中/高），比纯线性对比更强
  const nodeTier = (n: { messages: number }) => {
    const ratio = n.messages / maxMsg
    if (ratio >= 0.75) return 3
    if (ratio >= 0.5) return 2
    if (ratio >= 0.25) return 1
    return 0
  }
  const nodeRadius = (n: { messages: number }) => [7, 10, 14, 18][nodeTier(n)]
  // 是否有任意悬停（节点或边）
  const anyHover = hoveredNode !== null || hoveredEdge !== null
  // 边是否高亮：悬停节点相关，或该边自身被悬停
  const edgeIsHighlighted = (e: { source: number; target: number }) =>
    (hoveredNode === null || e.source === hoveredNode || e.target === hoveredNode) &&
    (hoveredEdge === null || (hoveredEdge.source === e.source && hoveredEdge.target === e.target))
  // 节点是否高亮：悬停节点自身/邻居，或悬停边的端点
  const nodeIsHighlighted = (id: number) => {
    if (hoveredNode !== null) {
      return id === hoveredNode ||
        edges.some((e) => (e.source === hoveredNode && e.target === id) || (e.target === hoveredNode && e.source === id))
    }
    if (hoveredEdge !== null) {
      return id === hoveredEdge.source || id === hoveredEdge.target
    }
    return true
  }

  return (
    <div ref={svgWrapRef} style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
      {/* 缩放百分比 + 重置视图 */}
      {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
        <div style={{ position: 'absolute', top: 4, right: 4, zIndex: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#8c8c8c', background: 'rgba(255,255,255,0.8)', padding: '1px 6px', borderRadius: 4 }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
            style={{ fontSize: 11, cursor: 'pointer', border: '1px solid #d9d9d9', background: '#fff', borderRadius: 4, padding: '1px 6px', color: '#595959' }}
          >
            重置视图
          </button>
        </div>
      )}
      <svg
        ref={ref}
        width={size}
        height={size}
        style={{ maxWidth: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
        onMouseMove={onSvgMouseMove}
        onMouseUp={onSvgMouseUp}
        onMouseLeave={onSvgMouseUp}
        onWheel={onSvgWheel}
      >
        <defs>
          {/* 边箭头：默认灰、高亮蓝 */}
          <marker id="cg-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 Z" fill="#bfbfbf" />
          </marker>
          <marker id="cg-arrow-hl" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 Z" fill="#1890ff" />
          </marker>
          {/* 按 kind 的径向渐变：中心亮→边缘深，增强节点立体感 */}
          {Object.entries(KIND_COLORS).map(([kind, color]) => {
            // 将 hex 转为更亮/更暗版本
            const r = parseInt(color.slice(1, 3), 16)
            const g = parseInt(color.slice(3, 5), 16)
            const b = parseInt(color.slice(5, 7), 16)
            const lighter = `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)})`
            const darker = `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)})`
            return (
              <radialGradient key={kind} id={`cg-grad-${kind}`} cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor={lighter} />
                <stop offset="100%" stopColor={darker} />
              </radialGradient>
            )
          })}
          {/* 默认 kind 渐变 */}
          {(() => {
            const color = KIND_COLOR_DEFAULT
            const r = parseInt(color.slice(1, 3), 16)
            const g = parseInt(color.slice(3, 5), 16)
            const b = parseInt(color.slice(5, 7), 16)
            const lighter = `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)})`
            const darker = `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)})`
            return (
              <radialGradient id="cg-grad-default" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor={lighter} />
                <stop offset="100%" stopColor={darker} />
              </radialGradient>
            )
          })()}
        </defs>
        {/* 透明背景：接收平移拖拽 */}
        <rect x="0" y="0" width={size} height={size} fill="transparent" onMouseDown={onBgMouseDown} style={{ cursor: 'move' }} />
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
        {/* 边 */}
        {edges.map((e, i) => {
          const a = getPos(e.source)
          const b = getPos(e.target)
          if (!a || !b) return null
          const w = 0.5 + 3.5 * (e.count / maxCount)
          const baseOpacity = 0.2 + 0.6 * (e.count / maxCount)
          const highlighted = edgeIsHighlighted(e)
          const fwd = e.source_to_target ?? 0
          const rev = e.target_to_source ?? 0
          // 缩短端点避开节点圆
          const ra = nodeRadius(nodes.find((n) => n.id === e.source) || { messages: 0 })
          const rb = nodeRadius(nodes.find((n) => n.id === e.target) || { messages: 0 })
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len = Math.max(1, Math.hypot(dx, dy))
          const ux = dx / len
          const uy = dy / len
          const ax = a.x + ux * ra
          const ay = a.y + uy * ra
          const bx = b.x - ux * rb
          const by = b.y - uy * rb
          // 单向：画一条带箭头线（指向接收方）；双向：画一条线 + 两端各一个箭头
          const oneWay = (fwd > 0) !== (rev > 0)
          // 边按消息量比例渐变着色：连续插值 灰→蓝→紫
          const ratio = e.count / maxCount
          const edgeColorByCount = highlighted
            ? '#1890ff'
            : (() => {
                // 灰(191,191,191) → 蓝(24,144,255) → 紫(114,46,209)
                let r: number, g: number, b: number
                if (ratio < 0.5) {
                  const t = ratio * 2
                  r = Math.round(191 + (24 - 191) * t)
                  g = Math.round(191 + (144 - 191) * t)
                  b = Math.round(191 + (255 - 191) * t)
                } else {
                  const t = (ratio - 0.5) * 2
                  r = Math.round(24 + (114 - 24) * t)
                  g = Math.round(144 + (46 - 144) * t)
                  b = Math.round(255 + (209 - 255) * t)
                }
                return `rgb(${r},${g},${b})`
              })()
          const stroke = edgeColorByCount
          // 声誉差梯度：两端 Agent 声誉差≥30 时用虚线，标识"声誉悬殊协作"
          const srcNode = nodes.find((n) => n.id === e.source)
          const tgtNode = nodes.find((n) => n.id === e.target)
          const srcRep = srcNode?.reputation
          const tgtRep = tgtNode?.reputation
          const repDiff = (srcRep != null && tgtRep != null) ? Math.abs(srcRep - tgtRep) : null
          const reputationGap = repDiff != null && repDiff >= 30
          const arrow = highlighted ? 'url(#cg-arrow-hl)' : 'url(#cg-arrow)'
          const tooltip = (fwd || rev
            ? `${e.source}→${e.target}: ${fwd} 条 · ${e.target}→${e.source}: ${rev} 条 · 共 ${e.count}`
            : `${e.source} ↔ ${e.target}: ${e.count} 条消息`) + (repDiff != null ? ` · 声誉差 ${repDiff}${reputationGap ? '（悬殊）' : ''}` : '')
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          return (
            <g key={`e${i}`}>
              <line
                x1={oneWay ? ax : a.x + ux * ra}
                y1={oneWay ? ay : a.y + uy * ra}
                x2={oneWay ? bx : b.x - ux * rb}
                y2={oneWay ? by : b.y - uy * rb}
                stroke={stroke}
                strokeWidth={highlighted ? w + 1 : w}
                strokeOpacity={anyHover ? (highlighted ? 0.9 : 0.08) : baseOpacity}
                strokeDasharray={reputationGap && !highlighted ? '5 4' : undefined}
                markerEnd={oneWay ? arrow : undefined}
                markerStart={(!oneWay && fwd && rev) ? arrow : undefined}
                onMouseEnter={() => setHoveredEdge({ source: e.source, target: e.target })}
                onMouseLeave={() => setHoveredEdge(null)}
                style={{ cursor: 'pointer' }}
              >
                <title>{tooltip}</title>
              </line>
              {/* 高频边脉冲流光动画：ratio≥0.5 时叠加一条流动虚线 */}
              {ratio >= 0.5 && !anyHover && (() => {
                const flowDur = ratio >= 0.75 ? '1.5s' : '2.5s'
                const flowOpacity = ratio >= 0.75 ? 0.5 : 0.3
                return (
                  <line
                    x1={oneWay ? ax : a.x + ux * ra}
                    y1={oneWay ? ay : a.y + uy * ra}
                    x2={oneWay ? bx : b.x - ux * rb}
                    y2={oneWay ? by : b.y - uy * rb}
                    stroke={stroke}
                    strokeWidth={Math.max(1, w * 0.6)}
                    strokeOpacity={flowOpacity}
                    strokeDasharray="6 10"
                    markerEnd={undefined}
                    markerStart={undefined}
                    style={{ pointerEvents: 'none' }}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="-32" dur={flowDur} repeatCount="indefinite" />
                  </line>
                )
              })()}
              {showEdgeLabels && (
                <text
                  x={mx}
                  y={my}
                  fontSize={9}
                  fill={highlighted ? '#1890ff' : '#8c8c8c'}
                  textAnchor="middle"
                  dy={-2}
                  style={{ pointerEvents: 'none' }}
                >
                  {e.count}
                </text>
              )}
            </g>
          )
        })}

        {/* 节点 */}
        {nodes.map((n) => {
          const pos = getPos(n.id)
          const isCenter = centerNodeId !== undefined && n.id === centerNodeId
          const r = nodeRadius(n) + (isCenter ? 3 : 0)
          const highlighted = nodeIsHighlighted(n.id)
          // 搜索匹配：有搜索词时，name 含词的节点 matched，其余 dimmed
          const matched = searchTerm
            ? (n.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            : true
          const dimmed = searchTerm ? !matched : false
          return (
            <g
              key={n.id}
              transform={`translate(${pos.x},${pos.y})`}
              style={{ cursor: 'grab', transition: (isDragging || layout === 'force') ? 'none' : 'transform 0.5s ease' }}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onMouseDown={(e) => { e.preventDefault(); onNodeDragStart(n.id) }}
              onClick={onNodeClick ? () => { if (dragMovedRef.current) { dragMovedRef.current = false; return }; onNodeClick(n.id) } : undefined}
            >
              {/* 声誉环：外圈环，颜色按 reputation，粗细按声誉梯度 */}
              {(() => {
                const rc = reputationColor(n.reputation)
                if (!rc) return null
                return (
                  <circle
                    r={r + 4}
                    fill="none"
                    stroke={rc}
                    strokeWidth={reputationStrokeWidth(n.reputation)}
                    strokeOpacity={dimmed ? 0.2 : (anyHover ? (highlighted ? 0.9 : 0.3) : 0.8)}
                  />
                )
              })()}
              <circle
                r={r}
                fill={highlighted ? '#1890ff' : kindGradientUrl(n.kind)}
                stroke={isCenter ? '#faad14' : '#fff'}
                strokeWidth={isCenter ? 3 : 1.5}
                fillOpacity={dimmed ? 0.2 : (anyHover ? (highlighted ? 1 : 0.4) : ([0.45, 0.6, 0.85, 1][nodeTier(n)]))}
              >
                <title>{`${n.name} (Agent#${n.id} · ${n.kind || 'unknown'}${isCenter ? ' · 中心' : ''}${n.reputation !== null && n.reputation !== undefined ? ` · 声誉 ${n.reputation}` : ''}): ${n.messages} 条消息`}</title>
              </circle>
              {/* 脉冲扩散环：按 nodeTier 活跃度动画，tier 越高脉冲越快越明显 */}
              {(() => {
                const tier = nodeTier(n)
                if (tier === 0 || dimmed) return null
                const dur = [0, 3.5, 2.5, 1.5][tier]
                const pulseColor = highlighted ? '#1890ff' : kindColor(n.kind)
                const pulseOpacity = anyHover ? (highlighted ? 0.6 : 0.15) : [0, 0.25, 0.4, 0.55][tier]
                return (
                  <circle
                    r={r}
                    fill="none"
                    stroke={pulseColor}
                    strokeWidth={2}
                    strokeOpacity={pulseOpacity}
                    style={{ pointerEvents: 'none' }}
                  >
                    <animate attributeName="r" from={r} to={r + 8} dur={`${dur}s`} repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" from={pulseOpacity} to="0" dur={`${dur}s`} repeatCount="indefinite" />
                  </circle>
                )
              })()}
              {/* 节点中心：tier≥2 且有声誉时显示声誉数值，否则显示消息量梯度内点 */}
              {(() => {
                const tier = nodeTier(n)
                if (n.reputation !== null && n.reputation !== undefined && tier >= 2) {
                  return (
                    <text
                      x={0}
                      y={3}
                      fontSize={tier >= 3 ? 9 : 8}
                      fill="#fff"
                      fontWeight="bold"
                      textAnchor="middle"
                      fillOpacity={dimmed ? 0.2 : (anyHover ? (highlighted ? 1 : 0.5) : 0.95)}
                      style={{ pointerEvents: 'none' }}
                    >
                      {Math.round(n.reputation)}
                    </text>
                  )
                }
                if (tier === 0) return null
                const innerR = [0, 2, 3.5, 5][tier]
                return (
                  <circle
                    r={innerR}
                    fill="#fff"
                    fillOpacity={dimmed ? 0.15 : (anyHover ? (highlighted ? 0.9 : 0.35) : 0.75)}
                    style={{ pointerEvents: 'none' }}
                  />
                )
              })()}
              <text
                x={r + 3}
                y={4}
                fontSize={10}
                fill={dimmed ? '#d9d9d9' : (highlighted ? '#1890ff' : (isCenter ? '#faad14' : kindColor(n.kind)))}
                fontWeight={highlighted || isCenter ? 'bold' : 'normal'}
                textAnchor={pos.x >= cx ? 'start' : 'end'}
                style={{ pointerEvents: 'none' }}
              >
                {n.name.length > 10 ? n.name.slice(0, 9) + '…' : n.name}
              </text>
              {/* 协作次数标签：节点下方浅色小字 */}
              <text
                x={0}
                y={r + 11}
                fontSize={9}
                fill={highlighted ? '#1890ff' : '#bfbfbf'}
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {n.messages}
              </text>
            </g>
          )
        })}
        </g>
      </svg>
      {/* kind 颜色图例 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        {Object.entries(KIND_COLORS).map(([kind, color]) => (
          <span key={kind} style={{ fontSize: 11, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color }} />
            {kind}
          </span>
        ))}
      </div>
      {/* 边色阶图例（按消息量连续渐变） */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: '#8c8c8c' }}>边色阶(消息量):</span>
        <span style={{ fontSize: 10, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ display: 'inline-block', width: 50, height: 6, borderRadius: 3, background: 'linear-gradient(to right, #bfbfbf, #1890ff, #722ed1)' }} />
          低 → 高
        </span>
        <span style={{ fontSize: 10, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ display: 'inline-block', width: 14, borderTop: '2px dashed #fa541c' }} />
          声誉差≥30
        </span>
      </div>
      {/* 节点尺寸图例（按消息量梯度） */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#8c8c8c' }}>节点尺寸(消息量, 中/高显示声誉值):</span>
        {[
          { r: 7, l: '低' },
          { r: 10, l: '中低' },
          { r: 14, l: '中' },
          { r: 18, l: '高' },
        ].map(({ r, l }) => (
          <span key={l} style={{ fontSize: 10, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: r, height: r, borderRadius: '50%', background: '#bfbfbf' }} />
            {l}
          </span>
        ))}
      </div>
      {/* 声誉环图例（颜色+粗细） */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#8c8c8c' }}>声誉环:</span>
        {[
          { c: '#ff4d4f', w: 1.5, l: '低(<40)' },
          { c: '#faad14', w: 2.5, l: '中(≥50)' },
          { c: '#52c41a', w: 3.5, l: '高(≥80)' },
        ].map(({ c, w, l }) => (
          <span key={l} style={{ fontSize: 10, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 16, height: w, background: c, borderRadius: 2 }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  )
})

CollaborationGraphView.displayName = 'CollaborationGraphView'

export default CollaborationGraphView
