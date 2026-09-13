import { Handle, Position, type NodeProps } from '@xyflow/react'
import { RobotOutlined } from '@ant-design/icons'
import { NODE_H, NODE_W, READINESS_STYLE, type TaskFlowNode } from './taskGraphModel'

/** 任务卡片节点：就绪态描边 + 选中高亮 + 淡出，左入右出（Handle 隐藏，纯视觉锚点）。 */
export function TaskNodeCard({ data }: NodeProps<TaskFlowNode>) {
  const style = READINESS_STYLE[data.readiness]
  return (
    <div
      style={{
        width: NODE_W,
        minHeight: NODE_H,
        background: '#fff',
        border: `1px solid ${style.border}55`,
        borderLeft: `5px solid ${data.inCycle ? '#cf1322' : style.border}`,
        borderRadius: 8,
        boxShadow: data.selected
          ? '0 0 0 3px rgba(9, 88, 217, 0.22), 0 2px 8px rgba(0,0,0,0.10)'
          : '0 1px 4px rgba(0,0,0,0.08)',
        opacity: data.dimmed ? 0.22 : 1,
        filter: data.dimmed ? 'grayscale(0.5)' : 'none',
        padding: '7px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 3,
        transition: 'opacity 0.25s ease, box-shadow 0.2s ease',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#262626',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '18px',
        }}
      >
        {data.readiness === 'done' && <span style={{ color: style.border, marginRight: 5 }}>✓</span>}
        {data.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            lineHeight: '16px',
            padding: '0 6px',
            borderRadius: 4,
            color: style.text,
            background: style.bg,
            border: `1px solid ${style.border}44`,
          }}
        >
          {data.readiness}
        </span>
        <span style={{ fontSize: 11, color: '#8c8c8c' }}>{data.idLabel}</span>
        {data.agentCount > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 11,
              lineHeight: '16px',
              padding: '0 5px',
              borderRadius: 4,
              color: '#0958d9',
              background: '#f0f5ff',
              border: '1px solid #adc6ff66',
            }}
            title={`agent ×${data.agentCount}`}
          >
            <RobotOutlined style={{ fontSize: 11 }} />
            {data.agentCount}
          </span>
        )}
        {data.inCycle && <span style={{ fontSize: 11, color: '#cf1322' }}>↻ cycle</span>}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
