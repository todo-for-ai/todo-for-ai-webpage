import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'
import type { WorkflowStepRunItem } from '../../../api/agents'

/** 步骤运行状态 → 视觉语义（仓库 UI 约束：蓝/绿/橙/中性，不用紫） */
export const RUN_STATUS_STYLE: Record<string, {
  label: string
  color: string
  bg: string
  border: string
}> = {
  pending: { label: '待执行', color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9' },
  waiting: { label: '等待中', color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
  running: { label: '运行中', color: '#1677ff', bg: '#e6f4ff', border: '#1677ff' },
  succeeded: { label: '成功', color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
  failed: { label: '失败', color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },
  skipped: { label: '已跳过', color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9' },
  cancelled: { label: '已取消', color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9' },
}

export const runStatusStyle = (status?: string) =>
  RUN_STATUS_STYLE[status ?? 'pending'] ?? RUN_STATUS_STYLE.pending

export interface RunStepNodeData extends Record<string, unknown> {
  stepRun: WorkflowStepRunItem
  selected: boolean
}

/** 运行步骤 → React Flow 节点/边；坐标优先取工作流定义的 layout，缺省 dagre 布局 */
export const runStepsToFlow = (
  stepRuns: WorkflowStepRunItem[],
  layout: Record<string, { x: number; y: number }>,
  selectedKey: string | null,
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = stepRuns.map(sr => ({
    id: sr.step_key,
    type: 'runStep',
    position: layout[sr.step_key] ?? { x: 60, y: 60 },
    data: { stepRun: sr, selected: selectedKey === sr.step_key },
  }))
  const edges: Edge[] = []
  for (const sr of stepRuns) {
    const active = sr.status === 'running'
    for (const dep of sr.depends_on ?? []) {
      const id = `r-${dep}-${sr.step_key}`
      if (edges.some(e => e.id === id)) continue
      edges.push({
        id,
        source: dep,
        target: sr.step_key,
        animated: active,
        style: {
          stroke: active ? '#1677ff' : '#bfbfbf',
          strokeWidth: active ? 2 : 1.2,
        },
      })
    }
  }
  return { nodes, edges }
}

/** 无坐标时的 dagre 自上而下布局（与编辑器 flowModel 同参，避免循环依赖单独实现） */
export const autoLayoutRunSteps = (
  stepRuns: WorkflowStepRunItem[],
): Record<string, { x: number; y: number }> => {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80, marginx: 40, marginy: 40 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const sr of stepRuns) g.setNode(sr.step_key, { width: 200, height: 64 })
  for (const sr of stepRuns) for (const dep of sr.depends_on ?? []) g.setEdge(dep, sr.step_key)
  dagre.layout(g)
  const out: Record<string, { x: number; y: number }> = {}
  for (const sr of stepRuns) {
    const pos = g.node(sr.step_key)
    out[sr.step_key] = {
      x: Math.round((pos?.x ?? 0) - 100),
      y: Math.round((pos?.y ?? 0) - 32),
    }
  }
  return out
}
