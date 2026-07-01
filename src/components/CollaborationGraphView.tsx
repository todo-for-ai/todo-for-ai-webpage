import React from 'react'
import { useState, useMemo } from 'react'
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
  /** 点击节点回调 */
  onNodeClick?: (agentId: number) => void
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
  onNodeClick,
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
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<{ source: number; target: number } | null>(null)

  if (nodes.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无协作关系数据" style={{ margin: '8px 0' }} />
  }

  const cx = size / 2
  const cy = size / 2
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
      // 简化力导向：初始圆周，迭代斥力（节点间）+ 吸引力（边），阻尼衰减
      const radius = size / 2 - 40
      const coords = nodes.map((n, i) => {
        const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1) - Math.PI / 2
        return { id: n.id, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), vx: 0, vy: 0 }
      })
      const idxMap = new Map(coords.map((c, i) => [c.id, i]))
      const iterations = 120
      const k = size / 10 // 理想距离尺度
      for (let it = 0; it < iterations; it++) {
        // 斥力
        for (let i = 0; i < coords.length; i++) {
          for (let j = i + 1; j < coords.length; j++) {
            let dx = coords[i].x - coords[j].x
            let dy = coords[i].y - coords[j].y
            let d = Math.hypot(dx, dy)
            if (d < 1) { d = 1; dx = Math.random() - 0.5; dy = Math.random() - 0.5 }
            const f = (k * k) / (d * d)
            const ux = dx / d
            const uy = dy / d
            coords[i].vx += ux * f
            coords[i].vy += uy * f
            coords[j].vx -= ux * f
            coords[j].vy -= uy * f
          }
        }
        // 吸引力（边）
        edges.forEach((e) => {
          const ai = idxMap.get(e.source)
          const bi = idxMap.get(e.target)
          if (ai === undefined || bi === undefined) return
          const dx = coords[bi].x - coords[ai].x
          const dy = coords[bi].y - coords[ai].y
          const d = Math.max(1, Math.hypot(dx, dy))
          const f = (d * d) / k
          const ux = dx / d
          const uy = dy / d
          coords[ai].vx += ux * f
          coords[ai].vy += uy * f
          coords[bi].vx -= ux * f
          coords[bi].vy -= uy * f
        })
        // 应用速度 + 中心引力 + 阻尼
        const damping = 0.85
        coords.forEach((c) => {
          c.vx = (c.vx + (cx - c.x) * 0.01) * damping
          c.vy = (c.vy + (cy - c.y) * 0.01) * damping
          c.x += Math.max(-12, Math.min(12, c.vx))
          c.y += Math.max(-12, Math.min(12, c.vy))
        })
      }
      coords.forEach((c) => pos.set(c.id, { x: c.x, y: c.y }))
    } else {
      const radius = size / 2 - 40 // 留出标签空间
      nodes.forEach((n, i) => {
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
        pos.set(n.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) })
      })
    }
    return pos
  }, [nodes, edges, layout, size, cx, cy])

  const nodeRadius = (n: { messages: number }) => 6 + 10 * (n.messages / maxMsg)
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
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg ref={ref} width={size} height={size} style={{ maxWidth: '100%' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* 边箭头：默认灰、高亮蓝 */}
          <marker id="cg-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 Z" fill="#bfbfbf" />
          </marker>
          <marker id="cg-arrow-hl" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 Z" fill="#1890ff" />
          </marker>
        </defs>
        {/* 边 */}
        {edges.map((e, i) => {
          const a = nodePos.get(e.source)
          const b = nodePos.get(e.target)
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
          const stroke = highlighted ? '#1890ff' : '#bfbfbf'
          const arrow = highlighted ? 'url(#cg-arrow-hl)' : 'url(#cg-arrow)'
          const tooltip = fwd || rev
            ? `${e.source}→${e.target}: ${fwd} 条 · ${e.target}→${e.source}: ${rev} 条 · 共 ${e.count}`
            : `${e.source} ↔ ${e.target}: ${e.count} 条消息`
          return (
            <line
              key={`e${i}`}
              x1={oneWay ? ax : a.x + ux * ra}
              y1={oneWay ? ay : a.y + uy * ra}
              x2={oneWay ? bx : b.x - ux * rb}
              y2={oneWay ? by : b.y - uy * rb}
              stroke={stroke}
              strokeWidth={highlighted ? w + 1 : w}
              strokeOpacity={anyHover ? (highlighted ? 0.9 : 0.08) : baseOpacity}
              markerEnd={oneWay ? arrow : undefined}
              markerStart={(!oneWay && fwd && rev) ? arrow : undefined}
              onMouseEnter={() => setHoveredEdge({ source: e.source, target: e.target })}
              onMouseLeave={() => setHoveredEdge(null)}
              style={{ cursor: 'pointer' }}
            >
              <title>{tooltip}</title>
            </line>
          )
        })}

        {/* 节点 */}
        {nodes.map((n) => {
          const pos = nodePos.get(n.id)!
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
              style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={onNodeClick ? () => onNodeClick(n.id) : undefined}
            >
              <circle
                r={r}
                fill={highlighted ? '#1890ff' : kindColor(n.kind)}
                stroke={isCenter ? '#faad14' : '#fff'}
                strokeWidth={isCenter ? 3 : 1.5}
                fillOpacity={dimmed ? 0.2 : (anyHover ? (highlighted ? 1 : 0.4) : 1)}
              >
                <title>{`${n.name} (Agent#${n.id} · ${n.kind || 'unknown'}${isCenter ? ' · 中心' : ''}): ${n.messages} 条消息`}</title>
              </circle>
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
    </div>
  )
})

CollaborationGraphView.displayName = 'CollaborationGraphView'

export default CollaborationGraphView
