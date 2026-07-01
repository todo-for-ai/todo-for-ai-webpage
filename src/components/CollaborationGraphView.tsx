import React from 'react'
import { useState } from 'react'
import { Empty, Typography } from 'antd'
import type { CollaborationGraph as GraphData } from '../api/agents'

const { Text } = Typography

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
        {/* 边 */}
        {edges.map((e, i) => {
          const a = nodePos.get(e.source)
          const b = nodePos.get(e.target)
          if (!a || !b) return null
          const w = 0.5 + 3.5 * (e.count / maxCount)
          const baseOpacity = 0.2 + 0.6 * (e.count / maxCount)
          const highlighted = edgeIsHighlighted(e)
          return (
            <line
              key={`e${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={highlighted ? '#1890ff' : '#bfbfbf'}
              strokeWidth={highlighted ? w + 1 : w}
              strokeOpacity={hoveredNode === null ? baseOpacity : (highlighted ? 0.9 : 0.08)}
            >
              <title>{`${e.source} ↔ ${e.target}: ${e.count} 条消息`}</title>
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
                fill={highlighted ? '#1890ff' : '#bfbfbf'}
                stroke="#fff"
                strokeWidth={1.5}
                fillOpacity={hoveredNode === null ? 1 : (highlighted ? 1 : 0.4)}
              >
                <title>{`${n.name} (Agent#${n.id}): ${n.messages} 条消息`}</title>
              </circle>
              <text
                x={r + 3}
                y={4}
                fontSize={10}
                fill={highlighted ? '#1890ff' : '#8c8c8c'}
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
    </div>
  )
}

export default CollaborationGraphView
