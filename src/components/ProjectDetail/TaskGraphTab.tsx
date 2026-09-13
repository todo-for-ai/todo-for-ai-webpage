import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Spin, Tag, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { taskGraphApi, type TaskGraphData, type TaskGraphNode } from '../../api/taskGraph'

interface TaskGraphTabProps {
  projectId: number
}

// 布局常量（px）
const NODE_W = 216
const NODE_H = 46
const GAP_X = 96
const GAP_Y = 14

// 状态色板（蓝/绿/橙/灰，深色描边文字 + 浅色底）
const READINESS_STYLE: Record<TaskGraphNode['readiness'], { border: string; bg: string; text: string }> = {
  ready: { border: '#0958d9', bg: '#e6f4ff', text: '#0958d9' },
  blocked: { border: '#d46b08', bg: '#fff7e6', text: '#d46b08' },
  done: { border: '#389e0d', bg: '#f6ffed', text: '#389e0d' },
  cancelled: { border: '#8c8c8c', bg: '#fafafa', text: '#595959' },
}
const CYCLE_BORDER = '#cf1322'

/** 分层：layer(n) = 前置（本项目内）最长链长度。环边不参与定层（环用警示横幅表达）。 */
function computeLayers(nodes: TaskGraphNode[], idSet: Set<number>): Map<number, number> {
  const blockersOf = new Map<number, number[]>()
  nodes.forEach((n) => {
    blockersOf.set(n.id, n.blocked_by.filter((b) => idSet.has(b) && b !== n.id))
  })
  const layers = new Map<number, number>()
  const visiting = new Set<number>()
  const depth = (id: number): number => {
    const cached = layers.get(id)
    if (cached !== undefined) return cached
    if (visiting.has(id)) return 0 // 环：按 0 层处理，环本身由横幅警示
    visiting.add(id)
    const deps = blockersOf.get(id) || []
    const value = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(depth))
    visiting.delete(id)
    layers.set(id, value)
    return value
  }
  nodes.forEach((n) => depth(n.id))
  return layers
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

  const layout = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return null
    const idSet = new Set(graph.nodes.map((n) => n.id))
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]))
    const layers = computeLayers(graph.nodes, idSet)

    // 列内顺序保持 id 稳定
    const columns = new Map<number, TaskGraphNode[]>()
    graph.nodes.forEach((n) => {
      const layer = layers.get(n.id) || 0
      if (!columns.has(layer)) columns.set(layer, [])
      columns.get(layer)!.push(n)
    })
    const sortedLayers = [...columns.keys()].sort((a, b) => a - b)

    const pos = new Map<number, { x: number; y: number }>()
    sortedLayers.forEach((layer, colIndex) => {
      const col = columns.get(layer)!.sort((a, b) => a.id - b.id)
      col.forEach((n, rowIndex) => {
        pos.set(n.id, {
          x: colIndex * (NODE_W + GAP_X),
          y: rowIndex * (NODE_H + GAP_Y),
        })
      })
    })

    const width = sortedLayers.length * (NODE_W + GAP_X) - GAP_X
    const maxRows = Math.max(...[...columns.values()].map((c) => c.length))
    const height = maxRows * NODE_H + (maxRows - 1) * GAP_Y
    return { pos, nodeById, width, height }
  }, [graph])

  if (loading && !graph) {
    return <Spin tip={tp('taskGraph.loading')} style={{ display: 'block', margin: '48px auto' }} />
  }
  if (error) {
    return <Alert type="error" showIcon message={tp('taskGraph.loadFailed')} description={error} />
  }
  if (!graph || graph.nodes.length === 0) {
    return <Alert type="info" showIcon message={tp('taskGraph.empty')} />
  }

  const cycleIds = new Set(graph.cycles.flat())
  const statEntries: Array<[keyof TaskGraphData['stats'], string]> = [
    ['total', tp('taskGraph.stats.total')],
    ['ready', tp('taskGraph.stats.ready')],
    ['blocked', tp('taskGraph.stats.blocked')],
    ['done', tp('taskGraph.stats.done')],
    ['cancelled', tp('taskGraph.stats.cancelled')],
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>{tp('taskGraph.title')}</span>
          {statEntries.map(([key, label]) => (
            <Tag key={key} style={{ borderRadius: 4, marginInlineEnd: 0 }}>
              {label}: {graph.stats[key]}
            </Tag>
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

      <div style={{ overflowX: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
        <div style={{ position: 'relative', width: layout!.width, height: layout!.height }}>
          <svg
            width={layout!.width}
            height={layout!.height}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <defs>
              <marker id="tg-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#bfbfbf" />
              </marker>
            </defs>
            {graph.edges.map((e, i) => {
              const from = layout!.pos.get(e.from)
              const to = layout!.pos.get(e.to)
              if (!from || !to) return null // 跨项目/失效引用不入图
              const x1 = from.x + NODE_W
              const y1 = from.y + NODE_H / 2
              const x2 = to.x
              const y2 = to.y + NODE_H / 2
              const mid = (x1 + x2) / 2
              const isCycleEdge = cycleIds.has(e.from) && cycleIds.has(e.to)
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2 - 2} ${y2}`}
                  fill="none"
                  stroke={isCycleEdge ? CYCLE_BORDER : '#bfbfbf'}
                  strokeWidth={isCycleEdge ? 2 : 1.5}
                  markerEnd="url(#tg-arrow)"
                />
              )
            })}
          </svg>

          {graph.nodes.map((n) => {
            const p = layout!.pos.get(n.id)
            if (!p) return null
            const style = READINESS_STYLE[n.readiness]
            const inCycle = cycleIds.has(n.id)
            return (
              <Tooltip key={n.id} title={`${n.title} (#${n.id})`}>
                <div
                  onClick={() => navigate(`/todo-for-ai/pages/tasks/${n.id}`)}
                  style={{
                    position: 'absolute',
                    left: p.x,
                    top: p.y,
                    width: NODE_W,
                    height: NODE_H,
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    borderLeft: `4px solid ${inCycle ? CYCLE_BORDER : style.border}`,
                    borderRadius: 6,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: style.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '18px',
                    }}
                  >
                    {n.title}
                  </div>
                  <div style={{ fontSize: 11, color: style.text, opacity: 0.85, lineHeight: '14px' }}>
                    {`#${n.id} · ${tp(`taskGraph.readiness.${n.readiness}`)}`}
                    {inCycle ? ` · ${tp('taskGraph.cycles.node')}` : ''}
                  </div>
                </div>
              </Tooltip>
            )
          })}
        </div>
      </div>
      <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>{tp('taskGraph.hint')}</div>
    </div>
  )
}
