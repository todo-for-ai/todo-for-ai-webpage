import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Descriptions, Drawer, Spin, Tag, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { agentsApi, type WorkflowRunItem, type WorkflowStepRunItem } from '../../../api/agents'
import { useCollaborationSSE } from '../../../hooks/useCollaborationSSE'
import { runStatusStyle } from './RunCanvasModel'

const { Text } = Typography

const NODE_W = 200
const NODE_H = 64
const PAD = 60

const STATUS_ICON: Record<string, string> = {
  pending: '○', waiting: '⏸', running: '⟳', succeeded: '✓', failed: '✕', skipped: '⊘', cancelled: '⊘',
}

const RUN_EVENTS = new Set([
  'workflow_step_started', 'workflow_step_finished', 'workflow_step_auto_retry',
  'workflow_step_overridden',
])

const fmtTime = (s?: string) => (s ? new Date(s).toLocaleTimeString() : '—')

const durationText = (sr: WorkflowStepRunItem): string => {
  if (!sr.started_at) return ''
  const end = sr.finished_at ? new Date(sr.finished_at).getTime() : Date.now()
  const sec = Math.max(0, Math.round((end - new Date(sr.started_at).getTime()) / 1000))
  return sec >= 60 ? `${Math.floor(sec / 60)}m${sec % 60}s` : `${sec}s`
}

const StepCard: React.FC<{
  sr: WorkflowStepRunItem
  selected: boolean
  onSelect: () => void
}> = ({ sr, selected, onSelect }) => {
  const style = runStatusStyle(sr.status)
  const isRunning = sr.status === 'running'
  return (
    <div
      onClick={onSelect}
      style={{
        width: NODE_W, minHeight: NODE_H, borderRadius: 6, cursor: 'pointer',
        border: `1.5px solid ${selected ? '#1677ff' : style.border}`,
        background: style.bg, padding: '8px 10px', fontSize: 12,
        boxShadow: selected ? '0 2px 8px rgba(22,119,255,0.25)' : '0 1px 2px rgba(0,0,0,0.06)',
        opacity: sr.status === 'skipped' || sr.status === 'cancelled' ? 0.65 : 1,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ color: style.color, fontSize: 13 }}>{STATUS_ICON[sr.status] ?? '○'}</span>
        <span style={{
          fontWeight: 600, color: style.color, flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {sr.name || sr.step_key}
        </span>
      </div>
      <div style={{
        color: '#8c8c8c', fontFamily: 'monospace', marginBottom: 4,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {sr.step_key}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, color: style.color, background: '#fff',
          borderRadius: 4, padding: '0 4px', border: `1px solid ${style.border}`,
        }}>
          {style.label}
        </span>
        {(sr.attempt ?? 1) > 1 && (
          <span style={{ fontSize: 10, color: '#d46b08', background: '#fff7e6', borderRadius: 4, padding: '0 4px' }}>
            第 {sr.attempt} 次
          </span>
        )}
        {durationText(sr) && (
          <span style={{ fontSize: 10, color: '#8c8c8c', background: '#fff', borderRadius: 4, padding: '0 4px' }}>
            {durationText(sr)}
          </span>
        )}
        {sr.agent_id != null && (
          <span style={{ fontSize: 10, color: '#1677ff', background: '#e6f4ff', borderRadius: 4, padding: '0 4px' }}>
            Agent #{sr.agent_id}
          </span>
        )}
      </div>
      {isRunning && (
        <style>{`.run-canvas-edge-running { stroke-dasharray: 6 4; animation: run-canvas-dash 1s linear infinite; } @keyframes run-canvas-dash { to { stroke-dashoffset: -10; } }`}</style>
      )}
    </div>
  )
}

interface WorkflowRunCanvasProps {
  runId: number
  onOpenConsole?: (runId: number) => void
}

/**
 * 运行态画布（只读）：工作流运行在 DAG 上的实时视图，借鉴 Dify 的运行面板。
 * 自绘实现（绝对定位节点 + SVG 连线），SSE 实时刷新 + 10s 轮询兜底。
 */
const WorkflowRunCanvas: React.FC<WorkflowRunCanvasProps> = ({ runId, onOpenConsole }) => {
  const [run, setRun] = useState<WorkflowRunItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const layoutRef = useRef<Record<string, { x: number; y: number }>>({})
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 })

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const runData = await agentsApi.getWorkflowRun(runId)
      if (Object.keys(layoutRef.current).length === 0) {
        try {
          const wf = await agentsApi.getWorkflow(runData.workflow_id)
          layoutRef.current = (wf.definition?.layout ?? {}) as Record<string, { x: number; y: number }>
        } catch { /* 布局缺失不阻塞渲染 */ }
        const steps = runData.step_runs ?? []
        const missing = steps.some(sr => !layoutRef.current[sr.step_key])
        if (steps.length === 0 || missing) {
          // 无坐标的步骤做简单分层布局（与 dagre 同思路的轻量实现）
          const depth: Record<string, number> = {}
          const byKey = new Map(steps.map(sr => [sr.step_key, sr]))
          const depthOf = (key: string, guard = 0): number => {
            if (depth[key] != null) return depth[key]
            if (guard > 50) return 0
            const sr = byKey.get(key)
            const deps = sr?.depends_on ?? []
            depth[key] = deps.length === 0 ? 0 : Math.max(...deps.map(d => depthOf(d, guard + 1) + 1))
            return depth[key]
          }
          const columnWidth = NODE_W + 90
          for (const sr of steps) {
            const d = depthOf(sr.step_key)
            if (layoutRef.current[sr.step_key] == null) {
              const sameColumn = Object.entries(depth).filter(([k, dd]) => dd === d && layoutRef.current[k]).length
              layoutRef.current[sr.step_key] = { x: PAD + d * columnWidth, y: PAD + sameColumn * (NODE_H + 50) }
            }
          }
        }
      }
      setRun(runData)
      setError(null)
    } catch (e: unknown) {
      const err = e as { message?: string }
      setError(err?.message || '加载运行失败')
    } finally {
      setLoading(false)
    }
  }, [runId])

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

  // 轮询兜底 + 容器尺寸自适应
  useEffect(() => {
    const timer = setInterval(() => void refresh(true), 10000)
    const measure = () => {
      if (boxRef.current) {
        setBoxSize({ w: boxRef.current.clientWidth, h: boxRef.current.clientHeight })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => { clearInterval(timer); window.removeEventListener('resize', measure) }
  }, [refresh])

  const steps = run?.step_runs ?? []

  // 视口计算：内容包围盒 → 适配容器
  const view = useMemo(() => {
    if (steps.length === 0 || boxSize.w === 0) return null
    const layout = layoutRef.current
    const xs = steps.map(sr => layout[sr.step_key]?.x ?? PAD)
    const ys = steps.map(sr => layout[sr.step_key]?.y ?? PAD)
    const minX = Math.min(...xs) - 20
    const minY = Math.min(...ys) - 20
    const maxX = Math.max(...xs.map((x, i) => x + NODE_W)) + 20
    const maxY = Math.max(...ys.map((y, i) => y + NODE_H)) + 20
    const contentW = maxX - minX
    const contentH = maxY - minY
    const scale = Math.min(boxSize.w / contentW, boxSize.h / contentH, 1.3)
    const tx = (boxSize.w - contentW * scale) / 2 - minX * scale
    const ty = (boxSize.h - contentH * scale) / 2 - minY * scale
    return { minX, minY, contentW, contentH, scale, tx, ty }
  }, [steps, boxSize])

  const byKey = useMemo(() => new Map(steps.map(sr => [sr.step_key, sr])), [steps])

  const selected = steps.find(s => s.step_key === selectedKey) ?? null
  const selectedStyle = selected ? runStatusStyle(selected.status) : null
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column' }}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <Text strong>运行 #{runId}</Text>
        {run && (
          <Tag color={run.status === 'succeeded' ? 'green' : run.status === 'failed' ? 'red' : run.status === 'running' ? 'blue' : 'default'}>
            {run.status}
          </Tag>
        )}
        {run?.error && <Text type="danger" style={{ fontSize: 12 }}>{run.error}</Text>}
        <Button size="small" icon={<ReloadOutlined />} onClick={() => void refresh(true)} style={{ marginLeft: 'auto' }}>
          刷新
        </Button>
        {onOpenConsole && run && (
          <Button size="small" onClick={() => onOpenConsole(run.id)}>控制台</Button>
        )}
      </div>
      {error && <Alert type="error" message={error} style={{ margin: 12 }} />}
      <div
        ref={boxRef}
        style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', background: '#fff' }}
      >
        {loading && !run ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spin tip="加载运行…" />
          </div>
        ) : (
          view && (
            <div
              style={{
                position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
                transformOrigin: '0 0',
              }}
            >
              {/* SVG 连线层（依赖方向：dep → step） */}
              <svg
                width={view.contentW + view.minX * 2}
                height={view.contentH + view.minY * 2}
                style={{ position: 'absolute', left: -view.minX, top: -view.minY, overflow: 'visible' }}
              >
                <defs>
                  <marker id="run-canvas-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" fill="#bfbfbf" />
                  </marker>
                  <marker id="run-canvas-arrow-running" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" fill="#1677ff" />
                  </marker>
                </defs>
                {steps.flatMap(sr =>
                  (sr.depends_on ?? []).map(dep => {
                    const from = layoutRef.current[dep]
                    const to = layoutRef.current[sr.step_key]
                    if (!from || !to) return null
                    const x1 = from.x + NODE_W
                    const y1 = from.y + NODE_H / 2
                    const x2 = to.x
                    const y2 = to.y + NODE_H / 2
                    const mx = (x1 + x2) / 2
                    const running = sr.status === 'running'
                    const done = byKey.get(dep)?.status === 'succeeded'
                    return (
                      <path
                        key={`${dep}->${sr.step_key}`}
                        d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 6} ${y2}`}
                        fill="none"
                        stroke={running ? '#1677ff' : done ? '#95de64' : '#d9d9d9'}
                        strokeWidth={running ? 2 : 1.4}
                        markerEnd={running ? 'url(#run-canvas-arrow-running)' : 'url(#run-canvas-arrow)'}
                        className={running ? 'run-canvas-edge-running' : undefined}
                      />
                    )
                  }),
                )}
              </svg>
              {/* 节点层 */}
              {steps.map(sr => {
                const pos = layoutRef.current[sr.step_key]
                if (!pos) return null
                return (
                  <div key={sr.step_key} style={{ position: 'absolute', left: pos.x, top: pos.y }}>
                    <StepCard
                      sr={sr}
                      selected={selectedKey === sr.step_key}
                      onSelect={() => setSelectedKey(sr.step_key)}
                    />
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      </div>

      {selected && (
        <div style={{
          width: 340, flexShrink: 0, borderLeft: '1px solid #f0f0f0',
          background: '#fafafa', padding: '14px 16px', overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Text strong>步骤 · {selected.name || selected.step_key}</Text>
            <Tag color={selectedStyle?.color} style={{ marginLeft: 'auto' }}>{selectedStyle?.label}</Tag>
          </div>
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
          <Button size="small" type="text" onClick={() => setSelectedKey(null)} style={{ marginTop: 10 }}>
            关闭详情
          </Button>
        </div>
      )}
    </div>
  )
}

export default WorkflowRunCanvas
