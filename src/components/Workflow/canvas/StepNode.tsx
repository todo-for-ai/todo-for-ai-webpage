import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { ApiOutlined, RobotOutlined } from '@ant-design/icons'
import type { CanvasStep } from './canvasModel'
import { INTEGRATION_PROVIDERS } from './canvasModel'

export interface WfStepNodeData extends Record<string, unknown> {
  step: CanvasStep
  selected: boolean
}

const StepNode: React.FC<{ data: WfStepNodeData }> = ({ data }) => {
  const { step, selected } = data
  const integration = step.integration_config
  const providerLabel = INTEGRATION_PROVIDERS.find(p => p.value === integration?.provider)?.label
  const isExternal = Boolean(integration?.provider)

  return (
    <div
      style={{
        width: 200,
        borderRadius: 6,
        border: `1.5px solid ${selected ? '#1677ff' : isExternal ? '#13c2c2' : '#91caff'}`,
        background: '#fff',
        boxShadow: selected ? '0 2px 8px rgba(22,119,255,0.25)' : '0 1px 2px rgba(0,0,0,0.08)',
        padding: '8px 10px',
        fontSize: 12,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#69b1ff' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {isExternal ? (
          <ApiOutlined style={{ color: '#13c2c2' }} />
        ) : (
          <RobotOutlined style={{ color: '#1677ff' }} />
        )}
        <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {step.name || step.step_key}
        </span>
      </div>
      <div style={{ color: '#8c8c8c', fontFamily: 'monospace', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {step.step_key}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {isExternal && (
          <span style={{
            fontSize: 10, color: '#13c2c2', background: '#e6fffb',
            borderRadius: 4, padding: '0 4px', border: '1px solid #87e8de',
          }}>
            {providerLabel}
          </span>
        )}
        {step.agent_id != null && (
          <span style={{ fontSize: 10, color: '#1677ff', background: '#e6f4ff', borderRadius: 4, padding: '0 4px' }}>
            指定 Agent #{step.agent_id}
          </span>
        )}
        {(step.required_capabilities?.length ?? 0) > 0 && (
          <span style={{ fontSize: 10, color: '#1677ff', background: '#e6f4ff', borderRadius: 4, padding: '0 4px' }}>
            {(step.required_capabilities ?? []).length} 能力
          </span>
        )}
        {step.condition && (
          <span style={{ fontSize: 10, color: '#fa8c16', background: '#fff7e6', borderRadius: 4, padding: '0 4px' }}>
            条件
          </span>
        )}
        {(step.retry_count ?? 0) > 0 && (
          <span style={{ fontSize: 10, color: '#52c41a', background: '#f6ffed', borderRadius: 4, padding: '0 4px' }}>
            重试 {step.retry_count}
          </span>
        )}
        {step.sub_workflow_id != null && (
          <span style={{ fontSize: 10, color: '#1677ff', background: '#e6f4ff', borderRadius: 4, padding: '0 4px' }}>
            子工作流 #{step.sub_workflow_id}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#69b1ff' }} />
    </div>
  )
}

export default StepNode
