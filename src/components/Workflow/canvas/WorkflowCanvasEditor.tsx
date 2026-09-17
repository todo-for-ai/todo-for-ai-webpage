import React, { useCallback, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import { Button, Input, InputNumber, message, Space, Tooltip } from 'antd'
import { NodeIndexOutlined, PartitionOutlined, SaveOutlined } from '@ant-design/icons'
import type { CreateWorkflowStepData, WorkflowItem } from '../../../api/agents'
import { makeBlankStep, withLayout, type CanvasStep } from './canvasModel'
import { applyConnect, applyDisconnect, autoLayout, stepsToFlow } from './flowModel'
import StepNode from './StepNode'
import StepConfigPanel from './StepConfigPanel'
import '@xyflow/react/dist/style.css'

const nodeTypes = { wfStep: StepNode }

interface WorkflowCanvasEditorProps {
  workflow: WorkflowItem
  agents: { id: number; name: string }[]
  workflows: { id: number; name: string }[]
  saving: boolean
  onSave: (payload: {
    name: string
    description: string
    max_parallel_steps: number
    definition: Record<string, unknown>
    steps: CreateWorkflowStepData[]
  }) => Promise<void>
}

/** steps(单一数据源) → flow 节点/边；坐标变化即时回写 steps */
const WorkflowCanvasEditor: React.FC<WorkflowCanvasEditorProps> = ({
  workflow, agents, workflows, saving, onSave,
}) => {
  const initialSteps = useMemo<CanvasStep[]>(() => {
    const layout = (workflow.definition?.layout ?? {}) as Record<string, { x: number; y: number }>
    const base: CanvasStep[] = [...workflow.steps]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(s => ({
        step_key: s.step_key,
        name: s.name,
        description: s.description,
        order: s.order,
        required_capabilities: s.required_capabilities ?? [],
        agent_id: s.agent_id ?? undefined,
        task_template_id: s.task_template_id ?? undefined,
        depends_on: s.depends_on ?? [],
        condition: s.condition ?? null,
        sub_workflow_id: s.sub_workflow_id ?? undefined,
        integration_config: s.integration_config ?? null,
        timeout_seconds: s.timeout_seconds ?? 0,
        retry_count: s.retry_count ?? 0,
        on_failure: (s.on_failure as CanvasStep['on_failure']) ?? 'abort',
        position: layout[s.step_key] ?? { x: 60, y: 60 },
      }))
    const positioned = base.some(s => layout[s.step_key]) ? base : autoLayout(base)
    return positioned.length > 0 ? positioned : [makeBlankStep(1, { x: 80, y: 120 })]
  }, [workflow])

  const [steps, setSteps] = useState<CanvasStep[]>(initialSteps)
  const initialFlow = useMemo(() => stepsToFlow(initialSteps), [initialSteps])
  const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialFlow.nodes)
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState(initialFlow.edges)
  const [selectedKey, setSelectedKey] = useState<string | null>(initialSteps[0]?.step_key ?? null)
  const [name, setName] = useState(workflow.name)
  const [description, setDescription] = useState(workflow.description ?? '')
  const [maxParallel, setMaxParallel] = useState(workflow.max_parallel_steps ?? 0)

  const syncFlow = useCallback((nextSteps: CanvasStep[]) => {
    const flow = stepsToFlow(nextSteps)
    setNodes(flow.nodes)
    setEdges(flow.edges)
  }, [setNodes, setEdges])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChangeBase(changes)
    // 拖动结束的位置变化回写 steps（position 单一来源仍以 steps 为准用于保存）
    const positions = new Map<string, { x: number; y: number }>()
    for (const c of changes) {
      if (c.type === 'position' && c.position) positions.set(c.id, c.position)
    }
    if (positions.size === 0) return
    setSteps(prev => prev.map(s => {
      const pos = positions.get(s.step_key)
      return pos ? { ...s, position: pos } : s
    }))
  }, [onNodesChangeBase])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const removals = changes.filter(c => c.type === 'remove')
    if (removals.length > 0) {
      setSteps(prev => {
        let next = prev
        for (const r of removals) {
          // 从当前边表还原 source/target（边 id 含 step_key 不可靠，key 可能带 -）
          const edge = edges.find(e => e.id === r.id)
          if (edge?.source && edge?.target) {
            next = applyDisconnect(next, edge.source, edge.target)
          }
        }
        syncFlow(next)
        return next
      })
    }
    onEdgesChangeBase(changes.filter(c => c.type !== 'remove'))
  }, [edges, onEdgesChangeBase, syncFlow])

  const onConnect = useCallback((conn: Connection) => {
    if (!conn.source || !conn.target) return
    setSteps(prev => {
      const next = applyConnect(prev, conn.source as string, conn.target as string)
      if (next === prev) {
        void message.warning('无效连线（自环或会成环）')
        return prev
      }
      syncFlow(next)
      return next
    })
  }, [syncFlow])

  const updateStep = useCallback((key: string, patch: Partial<CreateWorkflowStepData>) => {
    setSteps(prev => {
      const next = prev.map(s => (s.step_key === key ? { ...s, ...patch } : s))
      syncFlow(next)
      return next
    })
  }, [syncFlow])

  const removeStep = useCallback((key: string) => {
    setSteps(prev => {
      const next = prev
        .filter(s => s.step_key !== key)
        .map(s => ({ ...s, depends_on: (s.depends_on ?? []).filter(d => d !== key) }))
      syncFlow(next)
      setSelectedKey(next[0]?.step_key ?? null)
      return next
    })
  }, [syncFlow])

  const addStep = useCallback(() => {
    setSteps(prev => {
      const maxEnd = Math.max(0, ...prev.map(s => s.position.x + 220))
      const step = makeBlankStep(prev.length + 1, { x: maxEnd, y: 140 })
      const next = [...prev, step]
      syncFlow(next)
      setSelectedKey(step.step_key)
      return next
    })
  }, [syncFlow])

  const handleAutoLayout = useCallback(() => {
    setSteps(prev => {
      const next = autoLayout(prev)
      syncFlow(next)
      return next
    })
  }, [syncFlow])

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      void message.warning('工作流名称不能为空')
      return
    }
    const keys = steps.map(s => s.step_key.trim())
    if (keys.some(k => !k) || new Set(keys).size !== keys.length) {
      void message.warning('步骤 key 必须非空且唯一')
      return
    }
    for (const s of steps) {
      const integ = s.integration_config
      if (integ?.provider) {
        if (!integ.api_key && !integ.api_key_set) {
          void message.warning(`步骤 ${s.step_key}：连接器缺少 API Key`)
          return
        }
        if (integ.provider === 'coze' && !integ.workflow_id?.trim()) {
          void message.warning(`步骤 ${s.step_key}：Coze 需要填写工作流 ID`)
          return
        }
      }
      for (const dep of s.depends_on ?? []) {
        if (!keys.includes(dep)) {
          void message.warning(`步骤 ${s.step_key} 依赖了不存在的步骤 ${dep}`)
          return
        }
      }
    }
    await onSave({
      name: name.trim(),
      description,
      max_parallel_steps: maxParallel ?? 0,
      definition: withLayout(workflow.definition, steps),
      steps: steps.map((s, i) => {
        const { position, ...rest } = s
        void position
        const integ = rest.integration_config
        return {
          ...rest,
          order: i,
          step_key: s.step_key.trim(),
          integration_config: integ?.provider
            ? { ...integ, api_key: integ.api_key && !integ.api_key_set ? integ.api_key : undefined }
            : null,
        }
      }),
    })
  }, [steps, name, description, maxParallel, workflow.definition, onSave])

  const selected = steps.find(s => s.step_key === selectedKey) ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap',
      }}>
        <Input value={name} onChange={e => setName(e.target.value)} style={{ width: 220 }} placeholder="工作流名称" />
        <Input value={description} onChange={e => setDescription(e.target.value)} style={{ width: 260 }} placeholder="描述" />
        <InputNumber min={0} max={20} value={maxParallel} onChange={v => setMaxParallel(v ?? 0)} addonBefore="并行上限" />
        <Space style={{ marginLeft: 'auto' }}>
          <Tooltip title="添加步骤">
            <Button icon={<NodeIndexOutlined />} onClick={addStep}>添加步骤</Button>
          </Tooltip>
          <Tooltip title="按依赖自动排版">
            <Button icon={<PartitionOutlined />} onClick={handleAutoLayout}>自动布局</Button>
          </Tooltip>
          <Button type="primary" loading={saving} icon={<SaveOutlined />} onClick={handleSave}>
            保存
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedKey(node.id)}
            onPaneClick={() => setSelectedKey(null)}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls showInteractive={false} />
            {/* 右侧被配置面板覆盖，放左下角 */}
            <MiniMap pannable zoomable position="top-left" />
          </ReactFlow>
        </div>

        {/* Config panel */}
        <div style={{
          width: 320, flexShrink: 0, borderLeft: '1px solid #f0f0f0', background: '#fafafa',
        }}>
          {selected ? (
            <StepConfigPanel
              step={selected}
              stepKeys={steps.map(s => s.step_key)}
              agents={agents}
              workflows={workflows}
              onChange={patch => updateStep(selected.step_key, patch)}
              onRemoveDependency={dep => setSteps(prev => {
                const next = applyDisconnect(prev, dep, selected.step_key)
                syncFlow(next)
                return next
              })}
              onRemove={() => removeStep(selected.step_key)}
            />
          ) : (
            <div style={{ padding: 16, color: '#8c8c8c', fontSize: 12 }}>
              点击画布中的步骤节点编辑配置；从节点右侧圆点拖到另一节点左侧即建立依赖连线。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkflowCanvasEditor
