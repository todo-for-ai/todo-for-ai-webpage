import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, message, Tooltip } from 'antd'
import { AimOutlined, PlusOutlined } from '@ant-design/icons'
import {
  type CreateWorkflowStepData, type WorkflowItem, type WorkflowStepTestRunResult,
} from '../../../api/agents'
import {
  makeBlankStep, withLayout, validateCanvasContent, buildSavePayload, stepsFromWorkflow, type CanvasStep,
} from './canvasModel'
import { autoLayout } from './flowModel'
import {
  deriveEdges, edgeMidpoint, edgePath, fitTransform, ZOOM_MAX, ZOOM_MIN,
  NODE_H, NODE_W, type CanvasEdge,
} from './editCanvasModel'
import StepCard from './StepCard'
import CanvasToolbar from './CanvasToolbar'
import StepConfigPanel from './StepConfigPanel'

interface WorkflowCanvasEditorProps {
  workflow: WorkflowItem
  agents: { id: number; name: string }[]
  workflows: { id: number; name: string }[]
  saving: boolean
  /** 脏态上报：画布内容与已保存基线不一致时通知外层（用于关闭前确认） */
  onDirtyChange?: (dirty: boolean) => void
  /** 单步测试运行（外层注入；未提供时面板隐藏入口，如新建未落库的工作流） */
  onTestRun?: (stepKey: string) => Promise<WorkflowStepTestRunResult>
  onSave: (payload: {
    name: string
    description: string
    max_parallel_steps: number
    definition: Record<string, unknown>
    steps: CreateWorkflowStepData[]
  }) => Promise<void>
}

type DragState =
  | { kind: 'node'; key: string; startClient: { x: number; y: number }; startPos: { x: number; y: number }; moved: boolean }
  | { kind: 'pan'; startClient: { x: number; y: number }; startTx: number; startTy: number; moved: boolean }
  | { kind: 'link'; from: string }
  | null

/** steps(单一数据源) 的自绘 DAG 编辑画布：节点拖拽 / 连线 / 删边 / 平移缩放。
 *  弃用 React Flow 受控边（v12 存在状态有、DOM 无的不渲染坑，见运行态画布同款决策）。 */
const WorkflowCanvasEditor: React.FC<WorkflowCanvasEditorProps> = ({
  workflow, agents, workflows, saving, onDirtyChange, onTestRun, onSave,
}) => {
  const initialSteps = useMemo<CanvasStep[]>(
    () => stepsFromWorkflow(workflow, autoLayout),
    [workflow],
  )

  const [steps, setSteps] = useState<CanvasStep[]>(initialSteps)
  const [selectedKey, setSelectedKey] = useState<string | null>(initialSteps[0]?.step_key ?? null)
  const [selectedEdge, setSelectedEdge] = useState<CanvasEdge | null>(null)
  const [name, setName] = useState(workflow.name)
  const [description, setDescription] = useState(workflow.description ?? '')
  const [maxParallel, setMaxParallel] = useState(workflow.max_parallel_steps ?? 0)
  const [view, setView] = useState({ tx: 0, ty: 0, zoom: 1 })
  const [linkPos, setLinkPos] = useState<{ x: number; y: number } | null>(null)

  const boxRef = useRef<HTMLDivElement | null>(null)
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 })
  const dragRef = useRef<DragState>(null)
  const stepsRef = useRef(steps)
  stepsRef.current = steps
  const viewRef = useRef(view)
  viewRef.current = view
  const fittedRef = useRef(false)

  // 脏态 = 当前内容与打开时基线不一致（同名同序序列化比较，两侧均经过同一规范化构造）
  const baseline = useMemo(
    () => JSON.stringify({ steps: initialSteps, name: workflow.name, description: workflow.description ?? '', maxParallel: workflow.max_parallel_steps ?? 0 }),
    [initialSteps, workflow],
  )
  const dirty = useMemo(
    () => JSON.stringify({ steps, name, description, maxParallel }) !== baseline,
    [steps, name, description, maxParallel, baseline],
  )
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  // 容器尺寸测量 + 首次适配视野
  useEffect(() => {
    const measure = () => {
      if (boxRef.current) {
        const w = boxRef.current.clientWidth
        const h = boxRef.current.clientHeight
        setBoxSize(prev => (prev.w === w && prev.h === h ? prev : { w, h }))
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  useEffect(() => {
    if (!fittedRef.current && boxSize.w > 0) {
      fittedRef.current = true
      setView(fitTransform(stepsRef.current, boxSize))
    }
  }, [boxSize])

  const fitView = useCallback(() => {
    setView(fitTransform(stepsRef.current, boxRef.current
      ? { w: boxRef.current.clientWidth, h: boxRef.current.clientHeight }
      : boxSize))
  }, [boxSize])

  const worldPos = useCallback((clientX: number, clientY: number) => {
    const rect = boxRef.current?.getBoundingClientRect()
    const v = viewRef.current
    return {
      x: ((clientX - (rect?.left ?? 0)) - v.tx) / v.zoom,
      y: ((clientY - (rect?.top ?? 0)) - v.ty) / v.zoom,
    }
  }, [])

  const setStepsWith = useCallback((updater: (prev: CanvasStep[]) => CanvasStep[]) => {
    setSteps(prev => updater(prev))
  }, [])

  const applyConnect = useCallback((source: string, target: string): boolean => {
    if (source === target) return false
    // 拒绝成环：target 可达 source 时新边构成环
    const byKey = new Map(stepsRef.current.map(s => [s.step_key, s]))
    const seen = new Set<string>()
    const stack = [target]
    while (stack.length) {
      const cur = stack.pop() as string
      if (cur === source) return false
      if (seen.has(cur)) continue
      seen.add(cur)
      for (const dep of byKey.get(cur)?.depends_on ?? []) stack.push(dep)
    }
    let changed = false
    setStepsWith(prev => prev.map(s => {
      if (s.step_key !== target) return s
      const deps = s.depends_on ?? []
      if (deps.includes(source)) return s
      changed = true
      return { ...s, depends_on: [...deps, source] }
    }))
    return changed
  }, [setStepsWith])

  const applyDisconnect = useCallback((source: string, target: string) => {
    setStepsWith(prev => prev.map(s =>
      s.step_key === target
        ? { ...s, depends_on: (s.depends_on ?? []).filter(d => d !== source) }
        : s,
    ))
    setSelectedEdge(null)
  }, [setStepsWith])

  const removeStep = useCallback((key: string) => {
    setStepsWith(prev => prev
      .filter(s => s.step_key !== key)
      .map(s => ({ ...s, depends_on: (s.depends_on ?? []).filter(d => d !== key) })))
    setSelectedKey(cur => (cur === key ? null : cur))
    setSelectedEdge(null)
  }, [setStepsWith])

  const addStep = useCallback(() => {
    setStepsWith(prev => {
      const maxX = Math.max(0, ...prev.map(s => s.position.x + NODE_W))
      const step = makeBlankStep(prev.length + 1, { x: maxX + 60, y: 140 })
      setSelectedKey(step.step_key)
      setSelectedEdge(null)
      return [...prev, step]
    })
  }, [setStepsWith])

  // 复制步骤：克隆配置（不复制 API Key）偏移摆放
  const duplicateStep = useCallback((key: string) => {
    setStepsWith(prev => {
      const src = prev.find(s => s.step_key === key)
      if (!src) return prev
      const clone: CanvasStep = {
        ...src,
        step_key: `step_${prev.length + 1}_${Math.random().toString(36).slice(2, 6)}`,
        name: `${src.name} 副本`,
        position: { x: src.position.x + 32, y: src.position.y + 32 },
        integration_config: src.integration_config
          ? { ...src.integration_config, api_key: undefined }
          : null,
      }
      setSelectedKey(clone.step_key)
      return [...prev, clone]
    })
  }, [setStepsWith])

  const handleAutoLayout = useCallback(() => {
    setStepsWith(prev => autoLayout(prev))
    // 等一拍布局落位后再适配视野
    window.setTimeout(() => {
      setView(fitTransform(stepsRef.current, boxRef.current
        ? { w: boxRef.current.clientWidth, h: boxRef.current.clientHeight }
        : boxSize))
    }, 60)
  }, [setStepsWith, boxSize])

  // —— 指针交互（拖节点 / 连线 / 平移）——
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      if (d.kind === 'node') {
        const dx = (e.clientX - d.startClient.x) / viewRef.current.zoom
        const dy = (e.clientY - d.startClient.y) / viewRef.current.zoom
        if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true
        const nx = d.startPos.x + dx
        const ny = d.startPos.y + dy
        setSteps(prev => prev.map(s => (s.step_key === d.key ? { ...s, position: { x: nx, y: ny } } : s)))
      } else if (d.kind === 'pan') {
        const dx = e.clientX - d.startClient.x
        const dy = e.clientY - d.startClient.y
        if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true
        setView(v => ({ ...v, tx: d.startTx + dx, ty: d.startTy + dy }))
      } else if (d.kind === 'link') {
        setLinkPos(worldPos(e.clientX, e.clientY))
      }
    }
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current
      dragRef.current = null
      setLinkPos(null)
      if (!d) return
      if (d.kind === 'link') {
        const el = document.elementFromPoint(e.clientX, e.clientY)
        const target = el?.closest('[data-drop-key]')?.getAttribute('data-drop-key')
        if (target && !applyConnect(d.from, target)) {
          if (target !== d.from) void message.warning('无效连线（重复或会成环）')
        }
        return
      }
      if (d.kind === 'pan' && !d.moved) {
        // 点击空白：清除选择
        setSelectedKey(null)
        setSelectedEdge(null)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [applyConnect, worldPos])

  const startNodeDrag = useCallback((key: string) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    setSelectedKey(key)
    setSelectedEdge(null)
    const s = stepsRef.current.find(x => x.step_key === key)
    if (!s) return
    dragRef.current = { kind: 'node', key, startClient: { x: e.clientX, y: e.clientY }, startPos: { ...s.position }, moved: false }
  }, [])

  const startLink = useCallback((key: string) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    dragRef.current = { kind: 'link', from: key }
    setLinkPos(worldPos(e.clientX, e.clientY))
  }, [worldPos])

  const startPan = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    dragRef.current = { kind: 'pan', startClient: { x: e.clientX, y: e.clientY }, startTx: view.tx, startTy: view.ty, moved: false }
  }, [view.tx, view.ty])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    setView(v => {
      const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.zoom * factor))
      const rect = boxRef.current?.getBoundingClientRect()
      const cx = e.clientX - (rect?.left ?? 0)
      const cy = e.clientY - (rect?.top ?? 0)
      // 以指针为缩放中心
      const k = zoom / v.zoom
      return { zoom, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k }
    })
  }, [])

  // Delete 键删除选中边/节点；⌘/Ctrl+S 保存
  const handleSaveRef = useRef<() => Promise<void>>(async () => {})
  const handleSave = useCallback(async () => {
    const error = validateCanvasContent(name, steps)
    if (error) {
      void message.warning(error)
      return
    }
    await onSave(buildSavePayload(name, description, maxParallel ?? 0, workflow.definition, steps))
  }, [steps, name, description, maxParallel, workflow.definition, onSave])
  handleSaveRef.current = handleSave

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!saving) void handleSaveRef.current()
        return
      }
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEdge) {
          applyDisconnect(selectedEdge.from, selectedEdge.to)
        } else if (selectedKey) {
          removeStep(selectedKey)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saving, selectedEdge, selectedKey, applyDisconnect, removeStep])

  const edges = useMemo(() => deriveEdges(steps), [steps])
  const byKey = useMemo(() => new Map(steps.map(s => [s.step_key, s])), [steps])
  const selected = steps.find(s => s.step_key === selectedKey) ?? null
  const content = useMemo(() => {
    if (steps.length === 0) return null
    const minX = Math.min(...steps.map(s => s.position.x))
    const minY = Math.min(...steps.map(s => s.position.y))
    const maxX = Math.max(...steps.map(s => s.position.x + NODE_W))
    const maxY = Math.max(...steps.map(s => s.position.y + NODE_H))
    return { minX, minY, w: maxX - minX, h: maxY - minY }
  }, [steps])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CanvasToolbar
        name={name}
        description={description}
        maxParallel={maxParallel ?? 0}
        dirty={dirty}
        saving={saving}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onMaxParallelChange={v => setMaxParallel(v)}
        onAddStep={addStep}
        onAutoLayout={handleAutoLayout}
        onSave={() => void handleSave()}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Canvas */}
        <div
          ref={boxRef}
          onPointerDown={startPan}
          onWheel={onWheel}
          style={{
            flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden', background: '#fff',
            cursor: dragRef.current?.kind === 'pan' ? 'grabbing' : 'default',
            backgroundImage: 'radial-gradient(#e8e8e8 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          <div
            style={{
              position: 'absolute', left: 0, top: 0,
              transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* 连线层 */}
            <svg
              width={content ? content.minX + content.w + 200 : 10}
              height={content ? content.minY + content.h + 200 : 10}
              style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
            >
              <defs>
                <marker id="wf-edge-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill="#69b1ff" />
                </marker>
                <marker id="wf-edge-arrow-selected" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill="#fa8c16" />
                </marker>
              </defs>
              {edges.map(edge => {
                const from = byKey.get(edge.from)?.position
                const to = byKey.get(edge.to)?.position
                if (!from || !to) return null
                const isSelected = selectedEdge?.id === edge.id
                const mid = edgeMidpoint(from, to)
                return (
                  <g key={edge.id} style={{ pointerEvents: 'auto' }}>
                    {/* 加宽的透明命中区，便于点选边 */}
                    <path
                      d={edgePath(from, to)}
                      stroke="transparent" strokeWidth={14} fill="none"
                      style={{ cursor: 'pointer' }}
                      onPointerDown={e => {
                        e.stopPropagation()
                        setSelectedEdge(edge)
                        setSelectedKey(null)
                      }}
                    />
                    <path
                      d={edgePath(from, to)}
                      fill="none"
                      stroke={isSelected ? '#fa8c16' : '#69b1ff'}
                      strokeWidth={isSelected ? 2.2 : 1.5}
                      markerEnd={isSelected ? 'url(#wf-edge-arrow-selected)' : 'url(#wf-edge-arrow)'}
                      style={{ pointerEvents: 'none' }}
                    />
                    {edge.conditional && (
                      <text x={mid.x} y={mid.y - 6} textAnchor="middle" fontSize={10} fill="#8c8c8c">条件</text>
                    )}
                    {isSelected && (
                      <g
                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                        onPointerDown={e => {
                          e.stopPropagation()
                          applyDisconnect(edge.from, edge.to)
                        }}
                      >
                        <circle cx={mid.x} cy={mid.y} r={9} fill="#fff1f0" stroke="#ffa39e" />
                        <text x={mid.x} y={mid.y + 3.5} textAnchor="middle" fontSize={10} fill="#ff4d4f">✕</text>
                      </g>
                    )}
                  </g>
                )
              })}
              {/* 连线中的临时线 */}
              {dragRef.current?.kind === 'link' && linkPos && (() => {
                const from = byKey.get(dragRef.current.from)?.position
                if (!from) return null
                const x1 = from.x + NODE_W
                const y1 = from.y + NODE_H / 2
                const mx = (x1 + linkPos.x) / 2
                return (
                  <path
                    d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${linkPos.y}, ${linkPos.x} ${linkPos.y}`}
                    stroke="#91caff" strokeWidth={1.5} strokeDasharray="5 4" fill="none"
                  />
                )
              })()}
            </svg>
            {/* 节点层 */}
            {steps.map(s => (
              <div key={s.step_key} style={{ position: 'absolute', left: s.position.x, top: s.position.y }}>
                <StepCard
                  step={s}
                  selected={selectedKey === s.step_key}
                  onPointerDownCard={startNodeDrag(s.step_key)}
                  onPointerDownHandle={startLink(s.step_key)}
                />
              </div>
            ))}
          </div>

          {/* 缩放控件 */}
          <div style={{
            position: 'absolute', right: 12, bottom: 12, display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <Button size="small" icon={<PlusOutlined />} onClick={() => setView(v => ({ ...v, zoom: Math.min(ZOOM_MAX, v.zoom * 1.15) }))} />
            <Button size="small" onClick={() => setView(v => ({ ...v, zoom: Math.max(ZOOM_MIN, v.zoom / 1.15) }))}>−</Button>
            <Tooltip title="适应视图">
              <Button size="small" icon={<AimOutlined />} onClick={fitView} />
            </Tooltip>
          </div>
          <div style={{
            position: 'absolute', left: 12, bottom: 10, fontSize: 11, color: '#bfbfbf', pointerEvents: 'none',
          }}>
            拖动圆点连线 · 点击边可删除 · 滚轮缩放 · 空白处拖动平移
          </div>
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
              onChange={patch => setStepsWith(prev => prev.map(s => (s.step_key === selected.step_key ? { ...s, ...patch } : s)))}
              onRemoveDependency={dep => applyDisconnect(dep, selected.step_key)}
              onRemove={() => removeStep(selected.step_key)}
              onDuplicate={() => duplicateStep(selected.step_key)}
              onTestRun={onTestRun}
            />
          ) : (
            <div style={{ padding: 16, color: '#8c8c8c', fontSize: 12 }}>
              点击画布中的步骤节点编辑配置；从节点右侧圆点拖到另一节点即建立依赖连线。
              选中节点后按 Delete/Backspace 可删除，点击连线可删边。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkflowCanvasEditor
