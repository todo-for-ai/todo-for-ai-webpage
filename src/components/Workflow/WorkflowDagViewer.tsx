import React, { useMemo } from 'react'
import { Tag, Tooltip } from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  ReloadOutlined, StopOutlined, ApartmentOutlined,
} from '@ant-design/icons'

export interface DagStepData {
  step_key: string
  name: string
  depends_on?: string[]
  status?: string
  agent_id?: number | null
  task_id?: number | null
  required_capabilities?: string[]
  condition?: { step_key: string; operator: string; value?: string | boolean } | null
}

interface Props {
  steps: DagStepData[]
  width?: number
  height?: number
  interactive?: boolean
  selectedStepKey?: string | null
  onSelectStep?: (stepKey: string | null) => void
}

/** SVG-based DAG visualization for workflow steps */

const OPERATOR_LABELS: Record<string, string> = {
  succeeded: '成功时',
  failed: '失败时',
  skipped: '跳过时',
  output_contains: '输出包含',
  output_not_contains: '输出不含',
  output_equals: '输出等于',
}

function _conditionLabel(condition: { step_key: string; operator: string; value?: string | boolean }): string {
  const opLabel = OPERATOR_LABELS[condition.operator] || condition.operator
  const valueStr = condition.value !== undefined && condition.value !== null ? ` "${condition.value}"` : ''
  return `${condition.step_key} ${opLabel}${valueStr}`
}

const WorkflowDagViewer: React.FC<Props> = ({
  steps,
  width = 700,
  height = 300,
  interactive = false,
  selectedStepKey,
  onSelectStep,
}) => {
  // Compute layout: topological layers
  const { layers, edges, stepMap } = useMemo(() => {
    const map = new Map<string, DagStepData>()
    steps.forEach(s => map.set(s.step_key, s))

    // Kahn's algorithm for topological layering
    const inDegree = new Map<string, number>()
    const adjacency = new Map<string, string[]>()  // from -> to[]

    steps.forEach(s => {
      inDegree.set(s.step_key, 0)
      adjacency.set(s.step_key, [])
    })

    steps.forEach(s => {
      (s.depends_on || []).forEach(dep => {
        if (adjacency.has(dep)) {
          adjacency.get(dep)!.push(s.step_key)
          inDegree.set(s.step_key, (inDegree.get(s.step_key) || 0) + 1)
        }
      })
    })

    const layers: string[][] = []
    const visited = new Set<string>()
    let queue = steps.filter(s => (inDegree.get(s.step_key) || 0) === 0).map(s => s.step_key)

    while (queue.length > 0) {
      layers.push([...queue])
      queue.forEach(k => visited.add(k))
      const nextQueue: string[] = []
      queue.forEach(k => {
        (adjacency.get(k) || []).forEach(n => {
          if (!visited.has(n)) {
            const nd = (inDegree.get(n) || 1) - 1
            inDegree.set(n, nd)
            if (nd === 0) nextQueue.push(n)
          }
        })
      })
      queue = [...new Set(nextQueue)]
    }

    // Add any unvisited steps (cycles) as last layer
    const unvisited = steps.filter(s => !visited.has(s.step_key)).map(s => s.step_key)
    if (unvisited.length > 0) layers.push(unvisited)

    // Compute edges
    const edgesList: { from: string; to: string }[] = []
    steps.forEach(s => {
      (s.depends_on || []).forEach(dep => {
        edgesList.push({ from: dep, to: s.step_key })
      })
    })

    return { layers, edges: edgesList, stepMap: map }
  }, [steps])

  // Layout constants
  const nodeW = 140
  const nodeH = 50
  const layerGap = 60
  const nodeGap = 20
  const padding = 40

  // Compute node positions
  const positions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>()
    const maxLayerSize = Math.max(...layers.map(l => l.length), 1)

    layers.forEach((layer, li) => {
      const totalHeight = layer.length * nodeH + (layer.length - 1) * nodeGap
      const startY = (height - totalHeight) / 2
      const x = padding + li * (nodeW + layerGap)

      layer.forEach((key, ni) => {
        pos.set(key, {
          x,
          y: startY + ni * (nodeH + nodeGap),
        })
      })
    })

    return pos
  }, [layers, height])

  const statusColors: Record<string, string> = {
    pending: '#d9d9d9',
    waiting: '#faad14',
    running: '#1890ff',
    succeeded: '#52c41a',
    failed: '#ff4d4f',
    skipped: '#bfbfbf',
    cancelled: '#bfbfbf',
  }

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <ClockCircleOutlined />,
    waiting: <ClockCircleOutlined />,
    running: <ReloadOutlined spin />,
    succeeded: <CheckCircleOutlined />,
    failed: <CloseCircleOutlined />,
    skipped: <StopOutlined />,
    cancelled: <StopOutlined />,
  }

  // Compute SVG dimensions
  const svgWidth = Math.max(width, padding * 2 + layers.length * (nodeW + layerGap))
  const svgHeight = Math.max(height, padding * 2 + (Math.max(...layers.map(l => l.length), 1)) * (nodeH + nodeGap))

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #f0f0f0', borderRadius: 6, padding: 8, background: '#fafafa' }}>
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <defs>
          <marker id="dag-arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#bfbfbf" />
          </marker>
          <marker id="dag-arrow-condition" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#faad14" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const from = positions.get(e.from)
          const to = positions.get(e.to)
          if (!from || !to) return null
          const x1 = from.x + nodeW
          const y1 = from.y + nodeH / 2
          const x2 = to.x
          const y2 = to.y + nodeH / 2
          // Curved path
          const midX = (x1 + x2) / 2
          // Check if this edge has a condition on the target step
          const targetStep = stepMap.get(e.to)
          const isConditional = targetStep?.condition && targetStep.condition.step_key === e.from
          const conditionLabel = isConditional ? _conditionLabel(targetStep!.condition!) : null
          return (
            <g key={`edge-${i}`}>
              <path
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={isConditional ? '#faad14' : '#bfbfbf'}
                strokeWidth={1.5}
                strokeDasharray={isConditional ? '6 3' : 'none'}
                markerEnd={isConditional ? 'url(#dag-arrow-condition)' : 'url(#dag-arrow)'}
              />
              {conditionLabel && (
                <text
                  x={midX}
                  y={(y1 + y2) / 2 - 6}
                  fontSize={8}
                  fill="#faad14"
                  textAnchor="middle"
                  style={{ fontStyle: 'italic' }}
                >
                  {conditionLabel}
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {steps.map(step => {
          const pos = positions.get(step.step_key)
          if (!pos) return null
          const color = statusColors[step.status || 'pending'] || '#d9d9d9'
          const isSelected = selectedStepKey === step.step_key
          const hasCondition = !!step.condition
          return (
            <g
              key={step.step_key}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
              onClick={() => interactive && onSelectStep?.(isSelected ? null : step.step_key)}
            >
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeW}
                height={nodeH}
                rx={6}
                fill="white"
                stroke={isSelected ? '#1890ff' : color}
                strokeWidth={isSelected ? 2 : 1.5}
              />
              {/* Conditional step diamond marker */}
              {hasCondition && (
                <Tooltip title={`条件: ${_conditionLabel(step.condition!)}`}>
                  <polygon
                    points={`${pos.x + nodeW - 18},${pos.y + 6} ${pos.x + nodeW - 12},${pos.y + 2} ${pos.x + nodeW - 6},${pos.y + 6} ${pos.x + nodeW - 12},${pos.y + 10}`}
                    fill="#faad14"
                    stroke="#d48806"
                    strokeWidth={0.5}
                  />
                </Tooltip>
              )}
              {/* Status dot */}
              <circle cx={pos.x + 14} cy={pos.y + nodeH / 2} r={5} fill={color} />
              {/* Step name */}
              <text
                x={pos.x + 26}
                y={pos.y + nodeH / 2 - 5}
                fontSize={11}
                fontWeight={600}
                fill="#333"
                textAnchor="start"
              >
                {step.name.length > 10 ? step.name.slice(0, 10) + '…' : step.name}
              </text>
              {/* Step key */}
              <text
                x={pos.x + 26}
                y={pos.y + nodeH / 2 + 10}
                fontSize={9}
                fill="#8c8c8c"
                textAnchor="start"
              >
                {step.step_key}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap', fontSize: 11, color: '#8c8c8c' }}>
        {Object.entries(statusColors).map(([status, color]) => (
          <span key={status} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {status}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ApartmentOutlined style={{ fontSize: 12 }} /> 依赖方向: 左 → 右
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 16, height: 0, borderTop: '1.5px dashed #faad14', display: 'inline-block' }} />
          条件分支
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '8px solid #faad14', display: 'inline-block' }} />
          条件步骤
        </span>
      </div>
    </div>
  )
}

export default WorkflowDagViewer
