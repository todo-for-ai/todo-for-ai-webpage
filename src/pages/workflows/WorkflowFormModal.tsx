import React from 'react'
import { Modal, Form, Input, InputNumber, Button, Space, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { agentsApi, type CreateWorkflowStepData, type Agent, type WorkflowItem } from '../../api/agents'
import WorkflowDagViewer from '../../components/Workflow/WorkflowDagViewer'
import SortableStepCard from '../../components/Workflow/SortableStepCard'

const { TextArea } = Input

interface WorkflowFormModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  agents: Agent[]
  workflows: WorkflowItem[]
}

const WorkflowFormModal: React.FC<WorkflowFormModalProps> = ({ open, onClose, onCreated, agents, workflows }) => {
  const [form] = Form.useForm()
  const [steps, setSteps] = React.useState<CreateWorkflowStepData[]>([])
  const [selectedStepKey, setSelectedStepKey] = React.useState<string | null>(null)

  // Step editor helpers
  const addStep = () => {
    setSteps([...steps, {
      step_key: `step_${steps.length + 1}`,
      name: `步骤 ${steps.length + 1}`,
      order: steps.length,
      depends_on: [],
      required_capabilities: [],
      condition: null,
      on_failure: 'abort',
      timeout_seconds: 0,
      retry_count: 0,
    }])
  }

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  // Available step keys for depends_on
  const stepKeys = steps.map(s => s.step_key)

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      if (steps.length === 0) {
        const { message } = await import('antd')
        message.warning('至少需要一个步骤')
        return
      }
      await agentsApi.createWorkflow({
        name: values.name,
        description: values.description || '',
        max_parallel_steps: values.max_parallel_steps || 0,
        steps,
      })
      const { message } = await import('antd')
      message.success('工作流创建成功')
      handleClose()
      onCreated()
    } catch (e: any) {
      if (e?.errorFields) return
      const { message } = await import('antd')
      message.error('创建失败: ' + (e?.message || '未知错误'))
    }
  }

  const handleClose = () => {
    onClose()
    form.resetFields()
    setSteps([])
  }

  return (
    <Modal
      title="创建工作流"
      open={open}
      onCancel={handleClose}
      onOk={handleCreate}
      width={720}
      okText="创建"
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="工作流名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="例如：代码审查 → 测试 → 部署" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <TextArea rows={2} placeholder="工作流用途说明" />
        </Form.Item>
        <Form.Item name="max_parallel_steps" label="最大并行步骤" tooltip="0 表示不限制并行数量">
          <InputNumber min={0} max={20} placeholder="0 = 不限" style={{ width: '100%' }} />
        </Form.Item>
      </Form>

      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>步骤定义</strong>
        <Button size="small" icon={<PlusOutlined />} onClick={addStep}>添加步骤</Button>
      </div>

      {/* Live DAG preview */}
      {steps.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>DAG 预览（依赖方向：左 → 右）</div>
          <WorkflowDagViewer
            steps={steps.map(s => ({
              step_key: s.step_key,
              name: s.name,
              depends_on: s.depends_on || [],
              agent_id: s.agent_id,
              required_capabilities: s.required_capabilities,
            }))}
            width={660}
            height={200}
            interactive
            selectedStepKey={selectedStepKey}
            onSelectStep={setSelectedStepKey}
          />
        </div>
      )}

      {/* Draggable step editor */}
      <DndContext
        sensors={useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))}
        collisionDetection={closestCenter}
        onDragEnd={event => {
          const { active, over } = event
          if (over && active.id !== over.id) {
            const oldIndex = steps.findIndex(s => s.step_key === active.id)
            const newIndex = steps.findIndex(s => s.step_key === over.id)
            const reordered = arrayMove(steps, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }))
            setSteps(reordered)
          }
        }}
      >
        <SortableContext items={steps.map(s => s.step_key)} strategy={verticalListSortingStrategy}>
          {steps.map((step, idx) => (
            <SortableStepCard
              key={step.step_key}
              step={step}
              index={idx}
              stepKeys={stepKeys}
              agents={agents}
              workflows={workflows.map(w => ({ id: w.id, name: w.name }))}
              onUpdate={updateStep}
              onRemove={removeStep}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Modal>
  )
}

export default WorkflowFormModal
