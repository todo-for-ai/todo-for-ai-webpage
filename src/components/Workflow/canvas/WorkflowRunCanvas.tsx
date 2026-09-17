import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background, BackgroundVariant, Controls, MiniMap, ReactFlow,
  useEdgesState, useNodesState, type Edge, type Node,
} from '@xyflow/react'
import { Alert, Button, Descriptions, Drawer, Spin, Tag, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import {
  agentsApi, type WorkflowRunItem, type WorkflowStepRunItem,
} from '../../../api/agents'
import { useCollaborationSSE } from '../../../hooks/useCollaborationSSE'
import { autoLayoutRunSteps, runStatusStyle, runStepsToFlow, type RunStepNodeData } from './RunCanvasModel'
import RunNode from './RunNode'
import '@xyflow/react/dist/style.css'

const { Text } = Typography

const nodeTypes = { runStep: RunNode }

const RUN_EVENTS = new Set([
  'workflow_step_started', 'workflow_step_finished', 'workflow_step_auto_retry',
  'workflow_step_overridden',
])

const fmtTime = (s?: string) => (s ? new Date(s).toLocaleTimeString() : '—')

interface WorkflowRunCanvasProps {
  runId: number
  /** 打开控制台（保留旧视图入口） */
  onOpenConsole?: (runId: number) => void
}

/**
 * 运行态画布：工作流运行在 DAG 上的实时视图（借鉴 Dify 运行面板）。
 * 节点按步骤状态着色，运行中的边流动；SSE 驱动刷新 + 10s 轮询兜底。
 */
const WorkflowRunCanvas: React.FC<WorkflowRunCanvasProps> = ({ runId, onOpenConsole }) => {
  const [run, setRun] = useState<WorkflowRunItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const layoutRef = useRef<Record<string, { x: number; y: number }>>({})

  const initialNodes = useMemo<Node[]>(() => [], [])
  const initialEdges = useMemo<Edge[]>(() => [], [])
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const applyRun = useCallback((data: WorkflowRunItem, layout: Record<string, { x: number; y: number }>) => {
    setRun(data)
    const flow = runStepsToFlow(data.step_runs ?? [], layout, selectedKey)
    setNodes(flow.nodes)
    setEdges(flow.edges)
  }, [selectedKey, setEdges, setNodes])

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const runData = await agentsApi.getWorkflowRun(runId)
      // 布局只取一次：优先工作流定义的 layout，否则按当前步骤集合 dagre 排布
      if (Object.keys(layoutRef.current).length === 0) {
        try {
          const wf = await agentsApi.getWorkflow(runData.workflow_id)
          layoutRef.current = ((wf.definition?.layout ?? {}) as Record<string, { x: number; y: number }>)
        } catch { /* 布局缺失不阻塞渲染 */ }
        const covered = new Set((runData.step_runs ?? []).map(sr => sr.step_key))
        const hasAll = (runData.step_runs ?? []).every(sr => layoutRef.current[sr.step_key])
        if (!hasAll || covered.size === 0) {
          layoutRef.current = { ...layoutRef.current, ...autoLayoutRunSteps(runData.step_runs ?? []) }
        }
      }
      applyRun(runData, layoutRef.current)
      setError(null)
    } catch (e: unknown) {
      const err = e as { message?: string }
      setError(err?.message || '加载运行失败')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, applyRun])

  useEffect(() => {
    layoutRef.current = {}
    void refresh()
  }, [refresh])

  useCollaborationSSE({
    enabled: true,
    onEvent: useCallback((event: { event_type?: string; payload?: Record<string, unknown> }) => {
      const et = event.event_type || ''
      if (!RUN_EVENTS.has(et)) return
      const payload = event.payload || {}
      if (payload.run_id != null && payload.run_id !== runId) return
      void refresh(true)
    }, [runId, refresh]),
  })

  // 轮询兜底（SSE 断连时也能跟上）
  useEffect(() => {
    const timer = setInterval(() => void refresh(true), 10000)
    return () => clearInterval(timer)
  }, [refresh])

  const selected: WorkflowStepRunItem | null =
    run?.step_runs?.find(sr => sr.step_key === selectedKey) ?? null
  const selStyle = runStatusStyle(selected?.status)

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {error && <Alert type="error" message={error} style={{ margin: 12 }} />}
        {loading && !run ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spin tip="加载运行…" />
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => setSelectedKey(node.id)}
            onPaneClick={() => setSelectedKey(null)}
            fitView
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable position="top-left" />
          </ReactFlow>
        )}
        {/* 顶部状态条 */}
        <div style={{
          position: 'absolute', top: 10, left: 10, right: 10, display: 'flex',
          gap: 8, alignItems: 'center', pointerEvents: 'none', zIndex: 5,
        }}>
          <div style={{
            background: '#fff', border: '1px solid #f0f0f0', borderRadius: 6,
            padding: '4px 10px', display: 'flex', gap: 8, alignItems: 'center',
            pointerEvents: 'auto',
          }}>
            <Text strong>运行 #{runId}</Text>
            {run && <Tag color={run.status === 'succeeded' ? 'green' : run.status === 'failed' ? 'red' : run.status === 'running' ? 'blue' : 'default'}>{run.status}</Tag>}
            {run?.error && <Text type="danger" style={{ fontSize: 12 }}>{run.error}</Text>}
            <Button size="small" icon={<ReloadOutlined />} onClick={() => void refresh(true)}
              style={{ marginLeft: 'auto' }}>刷新</Button>
            {onOpenConsole && run && (
              <Button size="small" onClick={() => onOpenConsole(run.id)}>控制台</Button>
            )}
          </div>
        </div>
      </div>

      {/* 步骤详情抽屉 */}
      <Drawer
        title={selected ? `步骤 · ${selected.name || selected.step_key}` : ''}
        open={Boolean(selected)}
        onClose={() => setSelectedKey(null)}
        width={360}
        styles={{ body: { paddingTop: 12 } }}
      >
        {selected && (
          <>
            <Tag color={selStyle.color} style={{ marginBottom: 12 }}>{selStyle.label}</Tag>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="step_key">
                <Text code>{selected.step_key}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="尝试次数">{selected.attempt ?? 1}</Descriptions.Item>
              {selected.agent_id != null && (
                <Descriptions.Item label="Agent">#{selected.agent_id}</Descriptions.Item>
              )}
              {selected.task_id != null && (
                <Descriptions.Item label="任务 ID">#{selected.task_id}</Descriptions.Item>
              )}
              <Descriptions.Item label="开始">{fmtTime(selected.started_at)}</Descriptions.Item>
              <Descriptions.Item label="结束">{fmtTime(selected.finished_at)}</Descriptions.Item>
              {selected.error && (
                <Descriptions.Item label="错误">
                  <Text type="danger" style={{ whiteSpace: 'pre-wrap' }}>{selected.error}</Text>
                </Descriptions.Item>
              )}
              {selected.result_summary && (
                <Descriptions.Item label="输出">
                  <Text style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
                    {selected.result_summary}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default WorkflowRunCanvas
