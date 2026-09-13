import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  MarkerType,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { Alert, Button, Spin, Tag } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { useProjectGraphRealtime } from '../../hooks/useProjectGraphRealtime'
import { wsService } from '../../services/websocketService'
import { taskGraphApi, type TaskGraphData, type TaskGraphNode } from '../../api/taskGraph'
import '@xyflow/react/dist/style.css'

interface TaskGraphTabProps {
  projectId: number
}

// 布局常量（px）
const NODE_W = 224
const NODE_H = 56

// 就绪态色板（蓝/绿/橙/灰，与派发依赖门语义一致）
const READINESS_STYLE: Record<TaskGraphNode['readiness'], { border: string; bg: string; text: string }> = {
  ready: { border: '#0958d9', bg: '#e6f4ff', text: '#0958d9' },
  blocked: { border: '#d46b08', bg: '#fff7e6', text: '#d46b08' },
  done: { border: '#389e0d', bg: '#f6ffed', text: '#389e0d' },
  cancelled: { border: '#8c8c8c', bg: '#fafafa', text: '#595959' },
}
const CYCLE_COLOR = '#cf1322'
const EDGE_COLOR = '#b8bfc9'
const EDGE_DONE_COLOR = '#69b389'

type TaskNodeData = {
  title: string
  readiness: TaskGraphNode['readiness']
  inCycle: boolean
  idLabel: string
} & Record<string, unknown>

type TaskFlowNode = Node<TaskNodeData, 'taskNode'>

function TaskNodeCard({ data }: NodeProps<TaskFlowNode>) {
  const style = READINESS_STYLE[data.readiness]
  return (
    <div
      style={{
        width: NODE_W,
        minHeight: NODE_H,
        background: '#fff',
        border: `1px solid ${style.border}55`,
        borderLeft: `5px solid ${data.inCycle ? CYCLE_COLOR : style.border}`,
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '7px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 3,
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
        {data.readiness === 'done' && (
          <span style={{ color: style.border, marginRight: 5 }}>✓</span>
        )}
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
        {data.inCycle && (
          <span style={{ fontSize: 11, color: CYCLE_COLOR }}>↻ cycle</span>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}

const nodeTypes = { taskNode: TaskNodeCard }

/** dagre LR 自动分层布局：blocker 在左、下游在右。 */
function buildFlow(graph: TaskGraphData, cycleIds: Set<number>) {
  const idSet = new Set(graph.nodes.map((n) => n.id))
  const inProjectEdges = graph.edges.filter((e) => idSet.has(e.from) && idSet.has(e.to))

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 42, ranksep: 120, marginx: 28, marginy: 28 })
  graph.nodes.forEach((n) => g.setNode(String(n.id), { width: NODE_W, height: NODE_H }))
  // dagre 1.x 的 setEdge 必须显式给 label 对象（缺 label 时 layout 写 points 崩溃）
  inProjectEdges.forEach((e) => g.setEdge(String(e.from), String(e.to), {}))
  dagre.layout(g)

  const readinessById = new Map(graph.nodes.map((n) => [n.id, n.readiness]))
  const nodes: TaskFlowNode[] = graph.nodes.map((n) => {
    const pos = g.node(String(n.id))
    return {
      id: String(n.id),
      type: 'taskNode',
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: {
        title: n.title,
        readiness: n.readiness,
        inCycle: cycleIds.has(n.id),
        idLabel: `#${n.id}`,
      },
      draggable: false,
    }
  })
  const edges: Edge[] = inProjectEdges.map((e, i) => {
    const isCycle = cycleIds.has(e.from) && cycleIds.has(e.to)
    const sourceDone = readinessById.get(e.from) === 'done'
    const color = isCycle ? CYCLE_COLOR : sourceDone ? EDGE_DONE_COLOR : EDGE_COLOR
    return {
      id: `e-${e.from}-${e.to}-${i}`,
      source: String(e.from),
      target: String(e.to),
      type: 'smoothstep',
      animated: isCycle || sourceDone,
      style: { stroke: color, strokeWidth: isCycle ? 2.2 : 1.6 },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    }
  })
  return { nodes, edges }
}

export const TaskGraphTab: React.FC<TaskGraphTabProps> = ({ projectId }) => {
  const navigate = useNavigate()
  const { tp } = usePageTranslation('projectDetail')
  const [graph, setGraph] = useState<TaskGraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGraph = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setGraph(await taskGraphApi.getProjectTaskGraph(projectId))
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

  const flow = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return null
    return buildFlow(graph, new Set(graph.cycles.flat()))
  }, [graph])

  if (loading && !graph) {
    return <Spin tip={tp('taskGraph.loading')} style={{ display: 'block', margin: '48px auto' }} />
  }
  if (error) {
    return <Alert type="error" showIcon message={tp('taskGraph.loadFailed')} description={error} />
  }
  if (!graph || graph.nodes.length === 0 || !flow) {
    return <Alert type="info" showIcon message={tp('taskGraph.empty')} />
  }

  const statEntries: Array<[keyof TaskGraphData['stats'], string]> = [
    ['total', tp('taskGraph.stats.total')],
    ['ready', tp('taskGraph.stats.ready')],
    ['blocked', tp('taskGraph.stats.blocked')],
    ['done', tp('taskGraph.stats.done')],
    ['cancelled', tp('taskGraph.stats.cancelled')],
  ]
  const legendItems = (['ready', 'blocked', 'done', 'cancelled'] as const).map((key) => ({
    key,
    label: tp(`taskGraph.readiness.${key}`),
    color: READINESS_STYLE[key].border,
  }))
  const liveConnected = wsService.connected

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>{tp('taskGraph.title')}</span>
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
          {statEntries.map(([key, label]) => (
            <Tag key={key} style={{ borderRadius: 4, marginInlineEnd: 0 }}>
              {label}: {graph.stats[key]}
            </Tag>
          ))}
          {legendItems.map((item) => (
            <span key={item.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#595959' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: item.color }} />
              {item.label}
            </span>
          ))}
          {graph.truncated && <Tag color="orange" style={{ borderRadius: 4 }}>{tp('taskGraph.truncated')}</Tag>}
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchGraph} loading={loading} style={{ borderRadius: 6 }}>
          {tp('taskGraph.refresh')}
        </Button>
      </div>

      {graph.cycles.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={tp('taskGraph.cycles.title')}
          description={graph.cycles
            .map((group) => group.map((id) => `#${id}`).join(' ↔ '))
            .join('；')}
        />
      )}

      <div style={{ height: 480, border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <ReactFlow
          nodes={flow.nodes}
          edges={flow.edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1.05 }}
          minZoom={0.2}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, node) => navigate(`/todo-for-ai/pages/tasks/${node.id}`)}
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
              const readiness = (node.data as TaskNodeData).readiness
              return READINESS_STYLE[readiness].border
            }}
          />
        </ReactFlow>
      </div>
      <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>{tp('taskGraph.hint')}</div>
    </div>
  )
}
