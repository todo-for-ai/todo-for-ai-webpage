import React from 'react'
import { Handle, Position } from '@xyflow/react'
import {
  CheckCircleFilled, CloseCircleFilled, LoadingOutlined,
  MinusCircleOutlined, PauseCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import type { RunStepNodeData } from './RunCanvasModel'
import { runStatusStyle } from './RunCanvasModel'

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <ClockCircleOutlined style={{ color: '#8c8c8c' }} />,
  waiting: <PauseCircleOutlined style={{ color: '#d46b08' }} />,
  running: <LoadingOutlined style={{ color: '#1677ff' }} />,
  succeeded: <CheckCircleFilled style={{ color: '#52c41a' }} />,
  failed: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
  skipped: <MinusCircleOutlined style={{ color: '#8c8c8c' }} />,
  cancelled: <MinusCircleOutlined style={{ color: '#8c8c8c' }} />,
}

const durationText = (sr: RunStepNodeData['stepRun']): string => {
  if (!sr.started_at) return ''
  const end = sr.finished_at ? new Date(sr.finished_at).getTime() : Date.now()
  const sec = Math.max(0, Math.round((end - new Date(sr.started_at).getTime()) / 1000))
  return sec >= 60 ? `${Math.floor(sec / 60)}m${sec % 60}s` : `${sec}s`
}

const RunNode: React.FC<{ data: RunStepNodeData }> = ({ data }) => {
  const { stepRun, selected } = data
  const style = runStatusStyle(stepRun.status)
  const isRunning = stepRun.status === 'running'

  return (
    <div
      style={{
        width: 200,
        borderRadius: 6,
        border: `1.5px solid ${selected ? '#1677ff' : style.border}`,
        background: style.bg,
        boxShadow: selected ? '0 2px 8px rgba(22,119,255,0.25)' : '0 1px 2px rgba(0,0,0,0.06)',
        padding: '8px 10px',
        fontSize: 12,
        opacity: stepRun.status === 'skipped' || stepRun.status === 'cancelled' ? 0.65 : 1,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#bfbfbf' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span className={isRunning ? 'run-node-spin' : undefined}>
          {STATUS_ICON[stepRun.status] ?? STATUS_ICON.pending}
        </span>
        <span style={{
          fontWeight: 600, color: style.color, flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {stepRun.name || stepRun.step_key}
        </span>
      </div>
      <div style={{
        color: '#8c8c8c', fontFamily: 'monospace', marginBottom: 4,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {stepRun.step_key}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, color: style.color, background: '#fff',
          borderRadius: 4, padding: '0 4px', border: `1px solid ${style.border}`,
        }}>
          {style.label}
        </span>
        {(stepRun.attempt ?? 1) > 1 && (
          <span style={{ fontSize: 10, color: '#d46b08', background: '#fff7e6', borderRadius: 4, padding: '0 4px' }}>
            第 {stepRun.attempt} 次
          </span>
        )}
        {durationText(stepRun) && (
          <span style={{ fontSize: 10, color: '#8c8c8c', background: '#fff', borderRadius: 4, padding: '0 4px' }}>
            {durationText(stepRun)}
          </span>
        )}
        {stepRun.agent_id != null && (
          <span style={{ fontSize: 10, color: '#1677ff', background: '#e6f4ff', borderRadius: 4, padding: '0 4px' }}>
            Agent #{stepRun.agent_id}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#bfbfbf' }} />
    </div>
  )
}

export default RunNode
