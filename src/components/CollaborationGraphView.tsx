import React from 'react'
import { useState } from 'react'
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
  /** 布局：circular 环形（默认）| grid 网格 */
  layout?: 'circular' | 'grid'
  /** 点击节点回调 */
  onNodeClick?: (agentId: number) => void
}

/**
 * Agent 协作关系图（纯 SVG）。
 *
 * circular 布局：节点均匀分布在圆周上；grid 布局：节点按行列网格排列。
 * 节点按 messages 缩放半径；边为弦，按 count 缩放粗细与透明度。
 * 节点 hover 高亮其邻居。无第三方依赖。
 */
const CollaborationGraphView: React.FC<CollaborationGraphViewProps> = ({
  data,
  size = 360,
  layout = 'circular',
  onNodeClick,
}) => {
  const nodes = data?.nodes || []
  const edges = data?.edges || []
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)

  if (nodes.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无协作关系数据" style={{ margin: '8px 0' }} />
  }

  const cx = size / 2
  const cy = size / 2
  const maxMsg = Math.max(1, ...nodes.map((n) => n.messages))
  const maxCount = Math.max(1, ...edges.map((e) => e.count))

  // 节点位置
  const nodePos = new Map<number, { x: number; y: number }>()
  if (layout === 'grid') {
    const cols = Math.ceil(Math.sqrt(nodes.length))
    const cell = (size - 40) / Math.max(cols, 1)
    nodes.forEach((n, i) => {
      const row = Math.floor(i / cols)
      const col = i % cols
      nodePos.set(n.id, { x: 20 + cell * (col + 0.5), y: 20 + cell * (row + 0.5) })
    })
  } else {
    const radius = size / 2 - 40 // 留出标签空间
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
      nodePos.set(n.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) })
    })
  }

  const nodeRadius = (n: { messages: number }) => 6 + 10 * (n.messages / maxMsg)
  // 边是否与悬停节点相关
  const edgeIsHighlighted = (e: { source: number; target: number }) =>
    hoveredNode === null || e.source === hoveredNode || e.target === hoveredNode
  const nodeIsHighlighted = (id: number) =>
    hoveredNode === null || id === hoveredNode ||
    edges.some((e) => (e.source === hoveredNode && e.target === id) || (e.target === hoveredNode && e.source === id))

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ maxWidth: '100%' }}>
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
              strokeOpacity={hoveredNode === null ? baseOpacity : (highlighted ? 0.9 : 0.08)}
              markerEnd={oneWay ? arrow : undefined}
              markerStart={(!oneWay && fwd && rev) ? arrow : undefined}
            >
              <title>{tooltip}</title>
            </line>
          )
        })}

        {/* 节点 */}
        {nodes.map((n) => {
          const pos = nodePos.get(n.id)!
          const r = nodeRadius(n)
          const highlighted = nodeIsHighlighted(n.id)
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
                stroke="#fff"
                strokeWidth={1.5}
                fillOpacity={hoveredNode === null ? 1 : (highlighted ? 1 : 0.4)}
              >
                <title>{`${n.name} (Agent#${n.id} · ${n.kind || 'unknown'}): ${n.messages} 条消息`}</title>
              </circle>
              <text
                x={r + 3}
                y={4}
                fontSize={10}
                fill={highlighted ? '#1890ff' : kindColor(n.kind)}
                fontWeight={highlighted ? 'bold' : 'normal'}
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
}

export default CollaborationGraphView
