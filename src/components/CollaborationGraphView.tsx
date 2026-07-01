import React from 'react'
import { Empty, Typography } from 'antd'
import type { CollaborationGraph as GraphData } from '../api/agents'

const { Text } = Typography

interface CollaborationGraphViewProps {
  /** 图数据：nodes + edges */
  data: GraphData | null
  /** 画布宽度/高度（正方形，默认 360） */
  size?: number
  /** 点击节点回调 */
  onNodeClick?: (agentId: number) => void
}

/**
 * Agent 协作关系图（纯 SVG，环形布局）。
 *
 * 节点均匀分布在圆周上，按 messages 缩放半径；边为弦，按 count 缩放粗细与透明度。
 * 无第三方依赖，与 WorkflowDagViewer / MiniTrendChart 风格一致。
 */
const CollaborationGraphView: React.FC<CollaborationGraphViewProps> = ({
  data,
  size = 360,
  onNodeClick,
}) => {
  const nodes = data?.nodes || []
  const edges = data?.edges || []

  if (nodes.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无协作关系数据" style={{ margin: '8px 0' }} />
  }

  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 40 // 留出标签空间
  const maxMsg = Math.max(1, ...nodes.map((n) => n.messages))
  const maxCount = Math.max(1, ...edges.map((e) => e.count))

  // 节点位置：均匀分布
  const nodePos = new Map<number, { x: number; y: number }>()
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
    nodePos.set(n.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) })
  })

  const nodeRadius = (n: { messages: number }) => 6 + 10 * (n.messages / maxMsg)

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ maxWidth: '100%' }}>
        {/* 边 */}
        {edges.map((e, i) => {
          const a = nodePos.get(e.source)
          const b = nodePos.get(e.target)
          if (!a || !b) return null
          const w = 0.5 + 3.5 * (e.count / maxCount)
          const opacity = 0.2 + 0.6 * (e.count / maxCount)
          return (
            <line
              key={`e${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#1890ff"
              strokeWidth={w}
              strokeOpacity={opacity}
            >
              <title>{`${e.source} ↔ ${e.target}: ${e.count} 条消息`}</title>
            </line>
          )
        })}

        {/* 节点 */}
        {nodes.map((n) => {
          const pos = nodePos.get(n.id)!
          const r = nodeRadius(n)
          return (
            <g
              key={n.id}
              transform={`translate(${pos.x},${pos.y})`}
              style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
              onClick={onNodeClick ? () => onNodeClick(n.id) : undefined}
            >
              <circle r={r} fill="#1890ff" stroke="#fff" strokeWidth={1.5}>
                <title>{`${n.name} (Agent#${n.id}): ${n.messages} 条消息`}</title>
              </circle>
              <text
                x={r + 3}
                y={4}
                fontSize={10}
                fill="#595959"
                textAnchor={pos.x >= cx ? 'start' : 'end'}
                style={{ pointerEvents: 'none' }}
              >
                {n.name.length > 10 ? n.name.slice(0, 9) + '…' : n.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default CollaborationGraphView
