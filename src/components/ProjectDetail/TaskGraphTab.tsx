import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Spin, Tag, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { ReactFlow, Background, BackgroundVariant, Controls, MiniMap } from '@xyflow/react'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { useProjectGraphRealtime } from '../../hooks/useProjectGraphRealtime'
import { wsService } from '../../services/websocketService'
import { taskGraphApi, type TaskGraphData } from '../../api/taskGraph'
import { tasksApi, type Task } from '../../api/tasks'
import {
  READINESS_STYLE,
  buildFlow,
  collectChains,
  focusSetOf,
  progressSegments,
  type ReadinessFilter,
  type ReadinessKey,
} from './taskGraphModel'
import { TaskNodeCard } from './TaskNodeCard'
import { TaskDetailDrawer } from './TaskDetailDrawer'
import '@xyflow/react/dist/style.css'

interface TaskGraphTabProps {
  projectId: number
}

const nodeTypes = { taskNode: TaskNodeCard }

// 图例/筛选/进度条共用的就绪态顺序
const READINESS_ORDER: ReadinessKey[] = ['done', 'ready', 'blocked', 'cancelled']

const toggleFilterKey = (filter: ReadinessFilter, key: ReadinessKey): ReadinessFilter => {
  const next = new Set(filter)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

export const TaskGraphTab: React.FC<TaskGraphTabProps> = ({ projectId }) => {
  const navigate = useNavigate()
  const { tp } = usePageTranslation('projectDetail')
  const [graph, setGraph] = useState<TaskGraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [filter, setFilter] = useState<ReadinessFilter>(new Set())
  const [updating, setUpdating] = useState(false)

  const fetchGraph = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await taskGraphApi.getProjectTaskGraph(projectId)
      setGraph(next)
      // 刷新后选中节点若已不在图（删除/截断）则自动收起聚焦
      setSelectedId((prev) => (prev != null && next.nodes.some((n) => n.id === prev) ? prev : null))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) fetchGraph()
  }, [projectId, fetchGraph])

  // 实时刷新：加入项目房间，任务状态/依赖变化事件（去抖合并）后重取图
  useProjectGraphRealtime(projectId, fetchGraph)

  // Esc 清除聚焦
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const nodeById = useMemo(() => new Map((graph?.nodes || []).map((n) => [n.id, n])), [graph])
  const cycleIds = useMemo(() => new Set((graph?.cycles || []).flat()), [graph])
  const selectedNode = selectedId != null ? nodeById.get(selectedId) || null : null

  const chains = useMemo(() => {
    if (!graph || selectedId == null) return null
    return collectChains(graph.nodes, graph.edges, selectedId)
  }, [graph, selectedId])
  const focus = useMemo(() => (selectedId != null && chains ? focusSetOf(selectedId, chains) : null), [selectedId, chains])

  const flow = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return null
    return buildFlow(graph, { cycleIds, selectedId, focus, filter })
  }, [graph, cycleIds, selectedId, focus, filter])

  const handleStatusChange = useCallback(
    async (taskId: number, status: string) => {
      setUpdating(true)
      try {
        await tasksApi.updateTaskStatus(taskId, status as Task['status'])
        message.success(tp('taskGraph.drawer.updated'))
        await fetchGraph()
      } catch (e) {
        message.error(e instanceof Error ? e.message : tp('taskGraph.drawer.updateFailed'))
      } finally {
        setUpdating(false)
      }
    },
    [fetchGraph, tp],
  )

  if (loading && !graph) {
    return <Spin tip={tp('taskGraph.loading')} style={{ display: 'block', margin: '48px auto' }} />
  }
  if (error) {
    return <Alert type="error" showIcon message={tp('taskGraph.loadFailed')} description={error} />
  }
  if (!graph || graph.nodes.length === 0 || !flow) {
    return <Alert type="info" showIcon message={tp('taskGraph.empty')} />
  }

  const segments = progressSegments(graph.stats)
  const liveConnected = wsService.connected
  const focusActive = selectedNode != null && !!chains

  return (
    <div>
      {/* 标题行：实时态 + 刷新 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>
            {tp('taskGraph.title')}
            <span style={{ fontWeight: 400, color: '#8c8c8c', marginLeft: 8 }}>{tp('taskGraph.stats.total')} {graph.stats.total}</span>
          </span>
          <Tag
            color={liveConnected ? 'green' : 'default'}
            title={liveConnected ? tp('taskGraph.liveTip') : tp('taskGraph.offlineTip')}
            style={{ borderRadius: 4, marginInlineEnd: 0 }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: 3,
                marginRight: 5,
                background: liveConnected ? '#389e0d' : '#bfbfbf',
              }}
            />
            {liveConnected ? tp('taskGraph.live') : tp('taskGraph.offline')}
          </Tag>
          {graph.truncated && <Tag color="orange" style={{ borderRadius: 4 }}>{tp('taskGraph.truncated')}</Tag>}
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchGraph} loading={loading} style={{ borderRadius: 6 }}>
          {tp('taskGraph.refresh')}
        </Button>
      </div>

      {/* 体系条：图例即筛选（点击就绪态筛选节点），右侧进度条是同一份数据的占比视图，同样可点 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {READINESS_ORDER.map((key) => {
            const style = READINESS_STYLE[key]
            const active = filter.has(key)
            return (
              <Tag
                key={key}
                title={tp('taskGraph.filter.tip')}
                onClick={() => setFilter((prev) => toggleFilterKey(prev, key))}
                style={{
                  borderRadius: 4,
                  cursor: 'pointer',
                  marginInlineEnd: 0,
                  color: active ? style.text : '#8c8c8c',
                  background: active ? style.bg : '#fafafa',
                  border: `1px solid ${active ? `${style.border}88` : '#f0f0f0'}`,
                  userSelect: 'none',
                }}
              >
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, marginRight: 5, background: style.border }} />
                {tp(`taskGraph.readiness.${key}`)} {graph.stats[key]}
              </Tag>
            )
          })}
          {filter.size > 0 && (
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setFilter(new Set())}>
              {tp('taskGraph.filter.all')}
            </Button>
          )}
        </div>
        <div
          style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', flex: 1, maxWidth: 300, minWidth: 160, background: '#f0f0f0' }}
          title={tp('taskGraph.progress.tip')}
        >
          {segments.map((seg) => (
            <div
              key={seg.key}
              onClick={() => setFilter((prev) => toggleFilterKey(prev, seg.key))}
              style={{ width: `${(seg.count / Math.max(graph.stats.total, 1)) * 100}%`, background: READINESS_STYLE[seg.key].border, cursor: 'pointer' }}
            />
          ))}
        </div>
      </div>

      {/* 聚焦条：选中节点后展示传递上下游规模，可一键清除（Esc 同效） */}
      {focusActive && selectedNode && chains && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            padding: '5px 10px',
            marginBottom: 8,
            border: '1px solid #adc6ff',
            background: '#f0f5ff',
            borderRadius: 6,
            fontSize: 12,
            color: '#0958d9',
          }}
        >
          <span>
            {tp('taskGraph.focus.selected')} <b>#{selectedNode.id}</b> {selectedNode.title}
          </span>
          <span>
            {tp('taskGraph.focus.upstream')} {chains.upstream.size} · {tp('taskGraph.focus.downstream')} {chains.downstream.size}
          </span>
          <Button type="link" size="small" style={{ padding: 0, height: 'auto' }} onClick={() => setSelectedId(null)}>
            {tp('taskGraph.focus.clear')}
          </Button>
        </div>
      )}

      {graph.cycles.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 8 }}
          message={tp('taskGraph.cycles.title')}
          description={graph.cycles
            .map((group) => group.map((id) => `#${id}`).join(' ↔ '))
            .join('；')}
        />
      )}

      <div style={{ height: 500, border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <ReactFlow
          nodes={flow.nodes}
          edges={flow.edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1.05 }}
          minZoom={0.2}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, node) => setSelectedId(Number(node.id))}
          onNodeDoubleClick={(_, node) => navigate(`/todo-for-ai/pages/tasks/${node.id}`)}
          onPaneClick={() => setSelectedId(null)}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.4} color="#dfe4ea" />
          <Controls showInteractive={false} position="bottom-right" />
          <MiniMap
            position="top-right"
            pannable
            zoomable
            style={{ width: 150, height: 96, borderRadius: 6, background: '#f4f7fb' }}
            maskColor="rgba(15, 23, 42, 0.06)"
            nodeStrokeColor="#ffffff"
            nodeColor={(node) => {
              const data = node.data as { readiness: ReadinessKey; dimmed: boolean }
              return data.dimmed ? '#e4e7ec' : READINESS_STYLE[data.readiness].border
            }}
          />
        </ReactFlow>
      </div>
      <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>{tp('taskGraph.focus.hint')}</div>

      <TaskDetailDrawer
        node={selectedNode}
        nodeById={nodeById}
        open={selectedNode != null}
        updating={updating}
        onClose={() => setSelectedId(null)}
        onJumpToTask={(id) => setSelectedId(id)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
