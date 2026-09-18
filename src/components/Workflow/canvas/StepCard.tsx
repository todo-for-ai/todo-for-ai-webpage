import React from 'react'
import { INTEGRATION_PROVIDERS, type CanvasStep } from './canvasModel'
import { NODE_H, NODE_W } from './editCanvasModel'

/** 步骤卡片（自绘画布节点）：左侧目标圆点 + 右侧源圆点（拖出连线） */
const StepCard: React.FC<{
  step: CanvasStep
  selected: boolean
  onPointerDownCard: (e: React.PointerEvent) => void
  onPointerDownHandle: (e: React.PointerEvent) => void
}> = ({ step, selected, onPointerDownCard, onPointerDownHandle }) => {
  const integration = step.integration_config
  const providerLabel = INTEGRATION_PROVIDERS.find(p => p.value === integration?.provider)?.label
  const isExternal = Boolean(integration?.provider)
  return (
    <div
      data-drop-key={step.step_key}
      onPointerDown={onPointerDownCard}
      style={{
        width: NODE_W, minHeight: NODE_H, borderRadius: 6, cursor: 'grab', userSelect: 'none',
        border: `1.5px solid ${selected ? '#1677ff' : isExternal ? '#13c2c2' : '#91caff'}`,
        background: '#fff', padding: '8px 10px', fontSize: 12, boxSizing: 'border-box',
        boxShadow: selected ? '0 2px 8px rgba(22,119,255,0.25)' : '0 1px 2px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{
          fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: isExternal ? '#13c2c2' : 'inherit',
        }}>
          {isExternal ? '⑂ ' : ''}{step.name || step.step_key}
        </span>
      </div>
      <div style={{
        color: '#8c8c8c', fontFamily: 'monospace', marginBottom: 4,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {step.step_key}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {isExternal && (
          <span style={{ fontSize: 10, color: '#13c2c2', background: '#e6fffb', borderRadius: 4, padding: '0 4px', border: '1px solid #87e8de' }}>
            {providerLabel}
          </span>
        )}
        {step.agent_id != null && (
          <span style={{ fontSize: 10, color: '#1677ff', background: '#e6f4ff', borderRadius: 4, padding: '0 4px' }}>
            Agent #{step.agent_id}
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
      {/* 目标圆点（左） */}
      <div style={{
        position: 'absolute', left: -6, top: NODE_H / 2 - 6, width: 12, height: 12,
        borderRadius: '50%', background: '#69b1ff', border: '2px solid #fff',
        boxShadow: '0 0 0 1px #91caff', pointerEvents: 'none',
      }} />
      {/* 源圆点（右，拖出连线） */}
      <div
        onPointerDown={onPointerDownHandle}
        style={{
          position: 'absolute', right: -6, top: NODE_H / 2 - 6, width: 12, height: 12,
          borderRadius: '50%', background: '#69b1ff', border: '2px solid #fff',
          boxShadow: '0 0 0 1px #91caff', cursor: 'crosshair',
        }}
      />
    </div>
  )
}

export default StepCard
