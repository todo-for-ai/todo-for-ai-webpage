import React from 'react'
import { Card, Row, Col, Input, InputNumber, Select, Button, Tooltip } from 'antd'
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CreateWorkflowStepData } from '../../api/agents'

const { Option } = Select

interface SortableStepCardProps {
  step: CreateWorkflowStepData
  index: number
  stepKeys: string[]
  agents: { id: number; name: string; kind: string }[]
  workflows: { id: number; name: string }[]
  onUpdate: (index: number, field: string, value: any) => void
  onRemove: (index: number) => void
}

const CAPABILITY_OPTIONS = [
  { value: 'code_review', label: '代码审查' },
  { value: 'testing', label: '测试' },
  { value: 'deployment', label: '部署' },
  { value: 'documentation', label: '文档' },
  { value: 'research', label: '研究' },
  { value: 'coordination', label: '协调' },
  { value: 'frontend', label: '前端' },
  { value: 'backend', label: '后端' },
  { value: 'devops', label: '运维' },
  { value: 'security', label: '安全' },
]

const SortableStepCard: React.FC<SortableStepCardProps> = ({
  step, index, stepKeys, agents, workflows, onUpdate, onRemove,
}) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: step.step_key })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: 8,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              {...attributes}
              {...listeners}
              style={{ cursor: 'grab', color: '#bfbfbf', fontSize: 16 }}
            >
              <HolderOutlined />
            </span>
            <span>步骤 {index + 1}</span>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onRemove(index)} />
          </div>
        }
      >
        <Row gutter={8}>
          <Col span={6}>
            <Input
              size="small"
              placeholder="step_key"
              value={step.step_key}
              onChange={e => onUpdate(index, 'step_key', e.target.value)}
            />
          </Col>
          <Col span={10}>
            <Input
              size="small"
              placeholder="步骤名称"
              value={step.name}
              onChange={e => onUpdate(index, 'name', e.target.value)}
            />
          </Col>
          <Col span={8}>
            <Select
              size="small"
              mode="multiple"
              placeholder="依赖步骤"
              value={step.depends_on}
              onChange={v => onUpdate(index, 'depends_on', v)}
              style={{ width: '100%' }}
            >
              {stepKeys.filter(k => k !== step.step_key).map(k => (
                <Option key={k} value={k}>{k}</Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row gutter={8} style={{ marginTop: 8 }}>
          <Col span={8}>
            <Select
              size="small"
              mode="multiple"
              placeholder="所需能力"
              value={step.required_capabilities}
              onChange={v => onUpdate(index, 'required_capabilities', v)}
              style={{ width: '100%' }}
              options={CAPABILITY_OPTIONS}
            />
          </Col>
          <Col span={8}>
            <Select
              size="small"
              placeholder="指定 Agent"
              value={step.agent_id}
              onChange={v => onUpdate(index, 'agent_id', v)}
              style={{ width: '100%' }}
              allowClear
            >
              {agents.map(a => (
                <Option key={a.id} value={a.id}>{a.name} ({a.kind})</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Select
              size="small"
              placeholder="失败策略"
              value={step.on_failure}
              onChange={v => onUpdate(index, 'on_failure', v)}
              style={{ width: '100%' }}
            >
              <Option value="abort">中止</Option>
              <Option value="skip">跳过</Option>
              <Option value="continue">继续</Option>
            </Select>
          </Col>
        </Row>
        <Row gutter={8} style={{ marginTop: 8 }}>
          <Col span={8}>
            <Tooltip title="步骤超时时间（秒），0 表示不限时">
              <InputNumber
                size="small"
                placeholder="超时(秒)"
                value={step.timeout_seconds || 0}
                onChange={v => onUpdate(index, 'timeout_seconds', v || 0)}
                min={0}
                style={{ width: '100%' }}
              />
            </Tooltip>
          </Col>
          <Col span={8}>
            <Tooltip title="失败后自动重试次数">
              <InputNumber
                size="small"
                placeholder="重试次数"
                value={step.retry_count || 0}
                onChange={v => onUpdate(index, 'retry_count', v || 0)}
                min={0}
                max={10}
                style={{ width: '100%' }}
              />
            </Tooltip>
          </Col>
        </Row>
        <Row gutter={8} style={{ marginTop: 8 }}>
          <Col span={6}>
            <Select
              size="small"
              placeholder="条件步骤"
              value={step.condition?.step_key || undefined}
              onChange={v => onUpdate(index, 'condition', v ? { ...step.condition, step_key: v } : null)}
              style={{ width: '100%' }}
              allowClear
            >
              {stepKeys.filter(k => k !== step.step_key).map(k => (
                <Option key={k} value={k}>{k}</Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              size="small"
              placeholder="条件类型"
              value={step.condition?.operator || undefined}
              onChange={v => onUpdate(index, 'condition', step.condition ? { ...step.condition, operator: v } : { step_key: '', operator: v })}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="succeeded">成功时</Option>
              <Option value="failed">失败时</Option>
              <Option value="skipped">跳过时</Option>
              <Option value="output_contains">输出包含</Option>
              <Option value="output_not_contains">输出不包含</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Input
              size="small"
              placeholder="条件值（output_contains/output_not_contains 时使用）"
              value={typeof step.condition?.value === 'string' ? step.condition.value : ''}
              onChange={e => onUpdate(index, 'condition', step.condition ? { ...step.condition, value: e.target.value } : { step_key: '', operator: '', value: e.target.value })}
              disabled={!step.condition?.operator || !['output_contains', 'output_not_contains', 'output_equals'].includes(step.condition?.operator)}
            />
          </Col>
        </Row>
        {workflows.length > 0 && (
          <Row gutter={8} style={{ marginTop: 8 }}>
            <Col span={24}>
              <Select
                size="small"
                placeholder="子工作流（可选，嵌套调用另一个工作流）"
                value={step.sub_workflow_id || undefined}
                onChange={v => onUpdate(index, 'sub_workflow_id', v || null)}
                style={{ width: '100%' }}
                allowClear
              >
                {workflows.map(w => (
                  <Option key={w.id} value={w.id}>{w.name} (#{w.id})</Option>
                ))}
              </Select>
            </Col>
          </Row>
        )}
      </Card>
    </div>
  )
}

export default SortableStepCard
