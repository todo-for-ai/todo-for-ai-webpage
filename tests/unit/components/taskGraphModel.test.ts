import { describe, expect, it } from 'vitest'
import type { TaskGraphData, TaskGraphEdge, TaskGraphNode } from '../../../src/api/taskGraph'
import {
  CHAIN_COLOR,
  EDGE_DONE_COLOR,
  agentAssigneesOf,
  buildFlow,
  collectChains,
  focusSetOf,
  progressSegments,
} from '../../../src/components/ProjectDetail/taskGraphModel'

function node(partial: Partial<TaskGraphNode> & { id: number }): TaskGraphNode {
  return {
    title: `task-${partial.id}`,
    status: 'todo',
    readiness: 'ready',
    priority: 'medium',
    is_ai_task: false,
    epic_id: null,
    assignees: [],
    blocked_by: [],
    unresolved_blockers: [],
    ...partial,
  }
}

function graph(nodes: TaskGraphNode[], edges: TaskGraphEdge[]): TaskGraphData {
  return { project_id: 1, nodes, edges, cycles: [], stats: { total: nodes.length, ready: 0, blocked: 0, done: 0, cancelled: 0 }, truncated: false }
}

describe('collectChains 依赖链聚焦', () => {
  // 菱形：1 → 2,3 → 4（边方向 blocker → task）
  const diamond = [
    node({ id: 1 }),
    node({ id: 2, blocked_by: [1] }),
    node({ id: 3, blocked_by: [1] }),
    node({ id: 4, blocked_by: [2, 3] }),
  ]
  const edges: TaskGraphEdge[] = [
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
    { from: 3, to: 4 },
  ]

  it('菱形图：终点汇聚全部传递上游，起点扇出全部传递下游', () => {
    const up4 = collectChains(diamond, edges, 4)
    expect(up4.upstream).toEqual(new Set([1, 2, 3]))
    expect(up4.downstream).toEqual(new Set())

    const down1 = collectChains(diamond, edges, 1)
    expect(down1.upstream).toEqual(new Set())
    expect(down1.downstream).toEqual(new Set([2, 3, 4]))

    const mid2 = collectChains(diamond, edges, 2)
    expect(mid2.upstream).toEqual(new Set([1]))
    expect(mid2.downstream).toEqual(new Set([4]))
  })

  it('环不会死循环：环上节点都能收集到彼此', () => {
    const nodes = [node({ id: 1 }), node({ id: 2 }), node({ id: 3 })]
    const cycEdges: TaskGraphEdge[] = [
      { from: 1, to: 2 },
      { from: 2, to: 1 },
      { from: 2, to: 3 },
    ]
    const r = collectChains(nodes, cycEdges, 3)
    expect(r.upstream).toEqual(new Set([1, 2]))
    expect(r.downstream).toEqual(new Set())
  })

  it('跨项目边与自环不入链', () => {
    const nodes = [node({ id: 1, blocked_by: [99] }), node({ id: 2 })]
    const weirdEdges: TaskGraphEdge[] = [
      { from: 99, to: 1 },
      { from: 1, to: 1 },
    ]
    const r = collectChains(nodes, weirdEdges, 1)
    expect(r.upstream).toEqual(new Set())
    expect(r.downstream).toEqual(new Set())
  })
})

describe('agentAssigneesOf Agent 指派提取', () => {
  it('只取带数字 id 的 agent 指派，name 缺失回退 #id；人类与脏数据跳过', () => {
    const n = node({
      id: 1,
      assignees: [
        { type: 'agent', id: 7, name: 'Builder' },
        { type: 'agent', id: 8 },
        { type: 'human', id: 3, name: 'alice' },
        'garbage',
        { type: 'agent', name: 'no-id' },
      ] as TaskGraphNode['assignees'],
    })
    expect(agentAssigneesOf(n)).toEqual([
      { id: 7, name: 'Builder' },
      { id: 8, name: '#8' },
    ])
  })
})

describe('buildFlow 聚焦与筛选视觉态', () => {
  const g = graph(
    [
      node({ id: 1, readiness: 'done', status: 'done' }),
      node({ id: 2, readiness: 'ready', blocked_by: [1] }),
      node({ id: 3, readiness: 'blocked', blocked_by: [1], unresolved_blockers: [1] }),
      node({ id: 4, readiness: 'ready' }),
    ],
    [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
    ],
  )

  it('选中节点：链上节点不淡化，链外淡化，链上边蓝色动画', () => {
    const focus = focusSetOf(1, collectChains(g.nodes, g.edges, 1))
    const { nodes, edges } = buildFlow(g, { cycleIds: new Set(), selectedId: 1, focus })
    const byId = new Map(nodes.map((n) => [n.id, n.data]))
    expect(byId.get('1')!.dimmed).toBe(false)
    expect(byId.get('2')!.dimmed).toBe(false)
    expect(byId.get('3')!.dimmed).toBe(false)
    expect(byId.get('4')!.dimmed).toBe(true)

    const chainEdge = edges.find((e) => e.id === 'e-1-2-0')!
    expect(chainEdge.style!.stroke).toBe(CHAIN_COLOR)
    expect(chainEdge.animated).toBe(true)
    expect(chainEdge.style!.opacity).toBe(1)
  })

  it('链下边随聚焦淡出', () => {
    const focus = focusSetOf(2, collectChains(g.nodes, g.edges, 2))
    const { edges } = buildFlow(g, { cycleIds: new Set(), selectedId: 2, focus })
    const offChain = edges.find((e) => e.id === 'e-1-3-1')!
    expect(offChain.style!.opacity).toBe(0.12)
  })

  it('就绪态筛选：未命中节点淡化，已完成的边保持绿色语义', () => {
    const { nodes } = buildFlow(g, { cycleIds: new Set(), filter: new Set(['done']) })
    const byId = new Map(nodes.map((n) => [n.id, n.data]))
    expect(byId.get('1')!.dimmed).toBe(false)
    expect(byId.get('2')!.dimmed).toBe(true)
    expect(byId.get('4')!.dimmed).toBe(true)

    const noFocus = buildFlow(g, { cycleIds: new Set() })
    const doneEdge = noFocus.edges.find((e) => e.id === 'e-1-2-0')!
    expect(doneEdge.style!.stroke).toBe(EDGE_DONE_COLOR)
  })

  it('dagre 布局：blocker 在下游左侧（x 更小）', () => {
    const { nodes } = buildFlow(g, { cycleIds: new Set() })
    const byId = new Map(nodes.map((n) => [n.id, n]))
    expect(byId.get('1')!.position.x).toBeLessThan(byId.get('2')!.position.x)
  })
})

describe('progressSegments 统计条分段', () => {
  it('零值段丢弃，顺序 done→ready→blocked→cancelled', () => {
    expect(progressSegments({ total: 5, ready: 2, blocked: 0, done: 3, cancelled: 0 })).toEqual([
      { key: 'done', count: 3 },
      { key: 'ready', count: 2 },
    ])
  })
})
